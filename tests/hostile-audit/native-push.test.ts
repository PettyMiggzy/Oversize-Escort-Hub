import { afterEach, beforeEach, expect, test } from 'vitest'
import { generateKeyPairSync, createVerify } from 'node:crypto'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { getDb, resetHostile } from './mock-client'
import { POST as register, DELETE as unregister } from '@/app/api/push/device/route'
import { apnsBody, apnsToken, fcmBody, isDeadToken, safeUrl, sendNativePushToUsers } from '@/lib/native-push'

const TOKEN = 'a'.repeat(64)
const req = (method: string, body: unknown) => new NextRequest('http://x/api/push/device', { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })
const env = { ...process.env }

beforeEach(() => { resetHostile(); getDb().tables.profiles = [{ id: 'u1', role: 'escort', suspended: false, email: 'u1@example.com' }, { id: 'u2', role: 'escort', suspended: false, email: 'u2@example.com' }] })
afterEach(() => { process.env = { ...env } })

test('a signed-in phone registers once, the newest sign-in owns the token, bad input is refused', async () => {
  const db = getDb()
  db.sessionUser = null
  expect((await register(req('POST', { platform: 'ios', token: TOKEN }))).status).toBe(401)
  db.sessionUser = { id: 'u1', email: 'u1@example.com' }
  expect((await register(req('POST', { platform: 'windows', token: TOKEN }))).status).toBe(400)
  expect((await register(req('POST', { platform: 'ios', token: 'short' }))).status).toBe(400)
  expect((await register(req('POST', { platform: 'ios', token: 'bad token with spaces and symbols <>!!!' }))).status).toBe(400)
  expect((await register(req('POST', { platform: 'ios', token: TOKEN }))).status).toBe(200)
  expect((await register(req('POST', { platform: 'ios', token: TOKEN }))).status).toBe(200)
  expect(db.tables.device_tokens).toHaveLength(1)
  db.sessionUser = { id: 'u2', email: 'u2@example.com' }
  await register(req('POST', { platform: 'ios', token: TOKEN }))
  expect(db.tables.device_tokens).toHaveLength(1)
  expect((db.tables.device_tokens[0] as any).user_id).toBe('u2')
  // someone else cannot remove it
  db.sessionUser = { id: 'u1', email: 'u1@example.com' }
  await unregister(req('DELETE', { token: TOKEN }))
  expect(db.tables.device_tokens).toHaveLength(1)
  db.sessionUser = { id: 'u2', email: 'u2@example.com' }
  await unregister(req('DELETE', { token: TOKEN }))
  expect(db.tables.device_tokens).toHaveLength(0)
})

test('nothing is sent when the keys are not set, and a configured platform sends only to its own phones', async () => {
  const db = getDb()
  db.tables.device_tokens = [
    { id: 'a', user_id: 'u1', platform: 'ios', token: 'ios-token-' + 'x'.repeat(30) },
    { id: 'b', user_id: 'u1', platform: 'android', token: 'and-token-' + 'y'.repeat(30) },
  ]
  const calls: string[] = []
  const senders = { ios: async (t: string) => { calls.push('ios:' + t.slice(0, 3)); return { status: 200 } }, android: async (t: string) => { calls.push('android:' + t.slice(0, 3)); return { status: 200 } } }
  delete process.env.APNS_KEY_ID; delete process.env.FCM_SERVICE_ACCOUNT_JSON; delete process.env.APNS_TEAM_ID; delete process.env.APNS_KEY_P8
  expect(await sendNativePushToUsers(['u1'], { title: 't', body: 'b' }, senders as any)).toBe(0)
  expect(calls).toEqual([])
  process.env.FCM_SERVICE_ACCOUNT_JSON = '{}'
  expect(await sendNativePushToUsers(['u1'], { title: 't', body: 'b' }, senders as any)).toBe(1)
  expect(calls).toEqual(['android:and'])
  process.env.APNS_KEY_ID = 'K'; process.env.APNS_TEAM_ID = 'T'; process.env.APNS_KEY_P8 = 'x'
  calls.length = 0
  expect(await sendNativePushToUsers(['u1'], { title: 't', body: 'b' }, senders as any)).toBe(2)
  expect(calls.sort()).toEqual(['android:and', 'ios:ios'])
})

test('a dead token is forgotten, a failing phone does not stop the others, and strangers get nothing', async () => {
  const db = getDb()
  process.env.APNS_KEY_ID = 'K'; process.env.APNS_TEAM_ID = 'T'; process.env.APNS_KEY_P8 = 'x'
  db.tables.device_tokens = [
    { id: 'dead', user_id: 'u1', platform: 'ios', token: 'dead-' + 'x'.repeat(30) },
    { id: 'boom', user_id: 'u1', platform: 'ios', token: 'boom-' + 'x'.repeat(30) },
    { id: 'ok', user_id: 'u1', platform: 'ios', token: 'good-' + 'x'.repeat(30) },
    { id: 'other', user_id: 'u2', platform: 'ios', token: 'othr-' + 'x'.repeat(30) },
  ]
  const senders = { ios: async (t: string) => { if (t.startsWith('dead')) return { status: 410, reason: 'Unregistered' }; if (t.startsWith('boom')) throw new Error('network'); return { status: 200 } }, android: async () => ({ status: 200 }) }
  expect(await sendNativePushToUsers(['u1'], { title: 't', body: 'b' }, senders as any)).toBe(1)
  expect((db.tables.device_tokens as any[]).map((r) => r.id).sort()).toEqual(['boom', 'ok', 'other'])
})

test('payloads cut long text, open only paths on our own site, and tokens are signed properly', () => {
  expect(safeUrl('/loads/abc')).toBe('/loads/abc')
  for (const bad of ['https://evil.example', '//evil.example', 'javascript:alert(1)', '/a\\b', undefined, 5]) expect(safeUrl(bad)).toBe('/')
  const b = apnsBody({ title: 'T'.repeat(200), body: 'B'.repeat(500), url: '//evil.example' })
  expect(b.aps.alert.title.length).toBeLessThanOrEqual(80)
  expect(b.aps.alert.body.length).toBeLessThanOrEqual(200)
  expect(b.url).toBe('/')
  expect(fcmBody('tok', { title: 'a', body: 'b', url: '/x' }).message.data.url).toBe('/x')
  expect(isDeadToken('ios', { status: 410 })).toBe(true)
  expect(isDeadToken('ios', { status: 200 })).toBe(false)
  expect(isDeadToken('android', { status: 404 })).toBe(true)

  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  process.env.APNS_KEY_ID = 'ABC123DEFG'; process.env.APNS_TEAM_ID = 'H2V9CCFXLT'
  process.env.APNS_KEY_P8 = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().replace(/\n/g, '\\n')
  const jwt = apnsToken(Date.now() + 10 * 3600 * 1000)
  const [h, c, s] = jwt.split('.')
  expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toEqual({ alg: 'ES256', kid: 'ABC123DEFG' })
  expect(JSON.parse(Buffer.from(c, 'base64url').toString()).iss).toBe('H2V9CCFXLT')
  const ok = createVerify('sha256').update(`${h}.${c}`).verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))
  expect(ok).toBe(true)
})

test('alerts reach phones through the existing push path, the app registers only when switched on, and the table is documented', () => {
  expect(readFileSync('lib/push.ts', 'utf8')).toContain('sendNativePushToUsers')
  const c = readFileSync('components/NativePushRegister.tsx', 'utf8')
  expect(c).toContain("NEXT_PUBLIC_NATIVE_PUSH !== 'on'")
  expect(c).toContain("startsWith('/') && !u.startsWith('//')")
  expect(readFileSync('app/layout.tsx', 'utf8')).toContain('<NativePushRegister />')
  expect(readFileSync('docs/sql-device-tokens.sql', 'utf8')).toContain('revoke all on public.device_tokens from anon, authenticated')
})
