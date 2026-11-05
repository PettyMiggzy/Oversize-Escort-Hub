import { createPrivateKey, sign as cryptoSign } from 'node:crypto'
import http2 from 'node:http2'
import { serviceClient } from '@/lib/service-client'

// Push notifications to the iPhone and Android apps. iPhone goes straight to Apple (APNs), Android to Google (FCM).
// Nothing is sent until the owner's keys are set on the server; without them every call is a quiet no-op.

export type NativePayload = { title: string; body: string; url?: string }
export type Platform = 'ios' | 'android'

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url')

/** Only a path on our own site may be opened when a notification is tapped. */
export function safeUrl(u: unknown): string {
  return typeof u === 'string' && u.startsWith('/') && !u.startsWith('//') && !u.includes('\\') && u.length <= 300 ? u : '/'
}

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const pem = (s: string) => s.replace(/\\n/g, '\n')

export const apnsConfigured = () => !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_KEY_P8)
export const fcmConfigured = () => !!process.env.FCM_SERVICE_ACCOUNT_JSON

// ---- Apple ----
let apnsJwt: { token: string; at: number } | null = null
export function apnsToken(now = Date.now()): string {
  if (apnsJwt && now - apnsJwt.at < 40 * 60 * 1000) return apnsJwt.token
  const iat = Math.floor(now / 1000)
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID }))
  const claims = b64u(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat }))
  const data = `${head}.${claims}`
  const sig = cryptoSign('sha256', Buffer.from(data), { key: createPrivateKey(pem(process.env.APNS_KEY_P8!)), dsaEncoding: 'ieee-p1363' })
  apnsJwt = { token: `${data}.${b64u(sig)}`, at: now }
  return apnsJwt.token
}

export function apnsBody(p: NativePayload) {
  return { aps: { alert: { title: cut(p.title, 80), body: cut(p.body, 200) }, sound: 'default' }, url: safeUrl(p.url) }
}

/** Returns Apple's HTTP status (200 = delivered to Apple). */
export function sendApns(token: string, p: NativePayload): Promise<{ status: number; reason?: string }> {
  return new Promise((resolve) => {
    const host = process.env.APNS_ENV === 'sandbox' ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com'
    let done = false
    const finish = (r: { status: number; reason?: string }) => { if (!done) { done = true; resolve(r) } }
    try {
      const client = http2.connect(host)
      client.on('error', () => finish({ status: 0 }))
      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        authorization: `bearer ${apnsToken()}`,
        'apns-topic': process.env.APNS_BUNDLE_ID || 'pevo.oversizeescorthub.app',
        'apns-push-type': 'alert',
        'apns-priority': '10',
      })
      let status = 0, text = ''
      req.on('response', (h) => { status = Number(h[':status']) })
      req.setEncoding('utf8')
      req.on('data', (c) => { text += c })
      req.on('end', () => { client.close(); let reason: string | undefined; try { reason = JSON.parse(text).reason } catch { /* no body */ } finish({ status, reason }) })
      req.on('error', () => { client.close(); finish({ status: 0 }) })
      req.setTimeout(10000, () => { req.close(); client.close(); finish({ status: 0 }) })
      req.end(JSON.stringify(apnsBody(p)))
    } catch { finish({ status: 0 }) }
  })
}

// ---- Google ----
let fcmAccess: { token: string; exp: number } | null = null
async function fcmAccessToken(sa: { client_email: string; private_key: string; token_uri?: string }): Promise<string | null> {
  if (fcmAccess && fcmAccess.exp - Date.now() > 60_000) return fcmAccess.token
  const iat = Math.floor(Date.now() / 1000)
  const aud = sa.token_uri || 'https://oauth2.googleapis.com/token'
  const data = `${b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud, iat, exp: iat + 3600 }))}`
  const sig = cryptoSign('RSA-SHA256', Buffer.from(data), createPrivateKey(pem(sa.private_key)))
  const res = await fetch(aud, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${data}.${b64u(sig)}` }) })
  if (!res.ok) return null
  const j = await res.json()
  fcmAccess = { token: String(j.access_token), exp: Date.now() + Number(j.expires_in || 3000) * 1000 }
  return fcmAccess.token
}

export function fcmBody(token: string, p: NativePayload) {
  return { message: { token, notification: { title: cut(p.title, 80), body: cut(p.body, 200) }, data: { url: safeUrl(p.url) }, android: { priority: 'HIGH' } } }
}

export async function sendFcm(token: string, p: NativePayload): Promise<{ status: number; reason?: string }> {
  try {
    const sa = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON || '{}')
    if (!sa.client_email || !sa.private_key || !sa.project_id) return { status: 0 }
    const access = await fcmAccessToken(sa)
    if (!access) return { status: 0 }
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, { method: 'POST', headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' }, body: JSON.stringify(fcmBody(token, p)) })
    let reason: string | undefined
    if (!res.ok) { try { reason = (await res.json())?.error?.status } catch { /* no body */ } }
    return { status: res.status, reason }
  } catch { return { status: 0 } }
}

/** A token the phone company says is dead should be forgotten. */
export const isDeadToken = (platform: Platform, r: { status: number; reason?: string }) =>
  platform === 'ios' ? r.status === 410 || r.reason === 'BadDeviceToken' || r.reason === 'Unregistered' : r.status === 404 || r.reason === 'NOT_FOUND' || r.reason === 'UNREGISTERED'

type Senders = { ios: typeof sendApns; android: typeof sendFcm }

/** Send to every phone the given people have signed in on. Best effort: returns how many were accepted. */
export async function sendNativePushToUsers(userIds: string[], p: NativePayload, senders: Senders = { ios: sendApns, android: sendFcm }): Promise<number> {
  if (!userIds.length || (!apnsConfigured() && !fcmConfigured())) return 0
  const svc = serviceClient()
  const { data } = await svc.from('device_tokens').select('id, platform, token').in('user_id', [...new Set(userIds)])
  let sent = 0
  for (const row of (data ?? []) as { id: string; platform: Platform; token: string }[]) {
    if (row.platform === 'ios' ? !apnsConfigured() : !fcmConfigured()) continue
    try {
      const r = await senders[row.platform](row.token, p)
      if (r.status === 200) sent++
      else if (isDeadToken(row.platform, r)) await svc.from('device_tokens').delete().eq('id', row.id)
    } catch { /* one phone failing never stops the rest */ }
  }
  return sent
}
