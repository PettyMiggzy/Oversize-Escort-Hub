// How long a load may sit on the board. Nobody wants stranded posts, so:
//  - every load expires within 24 hours unless its poster keeps it up (hard cap 48 hours when posted),
//  - at 12 hours the poster gets one email: keep it up, or take it down,
//  - if two different escorts say "already taken", it comes off the board and the poster can put it back.
import { createHmac, timingSafeEqual } from 'crypto'
import { sendEmail } from '@/lib/email'

export const SITE = 'https://www.oversize-escort-hub.com'
export const CHECKIN_AFTER_MS = 12 * 3600000
export const KEEP_FOR_MS = 24 * 3600000
export const MAX_POST_HOLD_MS = 48 * 3600000
export const NO_EXPIRY_MAX_AGE_MS = 24 * 3600000
export const TAKEN_THRESHOLD = 2
const TOKEN_LIFE_MS = 3 * 86400000

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || 'no-key'
const sign = (id: string, ts: string) => createHmac('sha256', secret()).update(`loadcheck:${id}:${ts}`).digest('hex').slice(0, 32)

/** A link token for one load, good for three days: "<time>.<signature>". The poster needs no password. */
export function loadCheckToken(loadId: string, now = Date.now()): string {
  const ts = String(now)
  return `${ts}.${sign(loadId, ts)}`
}
export function verifyLoadCheckToken(loadId: string, token: unknown, now = Date.now()): boolean {
  if (typeof token !== 'string') return false
  const [ts, sig] = token.split('.')
  if (!ts || !sig || !/^\d{10,16}$/.test(ts)) return false
  const age = now - Number(ts)
  if (age < -60000 || age > TOKEN_LIFE_MS) return false
  const a = Buffer.from(sign(loadId, ts)), b = Buffer.from(sig)
  return a.length === b.length && timingSafeEqual(a, b)
}
export const loadCheckLink = (loadId: string) => `${SITE}/load-check/${loadId}?t=${loadCheckToken(loadId)}`

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
export type LoadLine = { id: string; pu_city?: string | null; pu_state?: string | null; dl_city?: string | null; dl_state?: string | null }
const route = (l: LoadLine) => `${l.pu_city || '?'}, ${l.pu_state || '?'} to ${l.dl_city || '?'}, ${l.dl_state || '?'}`

function shell(headline: string, body: string, link: string, button: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111"><h2 style="margin:0 0 12px">${esc(headline)}</h2><p style="font-size:15px;line-height:1.5">${body}</p><p style="margin:20px 0"><a href="${link}" style="background:#ff6a13;color:#000;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(button)}</a></p><p style="font-size:12px;color:#666">You get this because you posted a load on Oversize Escort Hub. Posts come down on their own after 24 hours so the board stays fresh.</p></div>`
}

/** "Still need escorts?" at 12 hours. */
export async function sendCheckinEmail(to: string, load: LoadLine, hoursOnBoard: number) {
  return sendEmail({
    to, subject: `Still need escorts? ${route(load)}`,
    html: shell('Still need escorts for this load?', `Your load <strong>${esc(route(load))}</strong> has been on the board for about ${Math.max(1, Math.round(hoursOnBoard))} hours. If it is covered, or you found someone another way, take it down so escorts do not chase it. If you still need help, keep it up. If you do nothing it comes off the board by itself.`, loadCheckLink(load.id), 'Keep it up or take it down'),
  })
}

/** Two escorts said it is taken. */
export async function sendTakenEmail(to: string, load: LoadLine) {
  return sendEmail({
    to, subject: `Your load was taken off the board: ${route(load)}`,
    html: shell('Your load was taken off the board', `Escorts told us <strong>${esc(route(load))}</strong> is already filled or taken, so we removed it. If that is wrong and you still need escorts, put it back with one tap.`, loadCheckLink(load.id), 'Put it back or leave it down'),
  })
}
