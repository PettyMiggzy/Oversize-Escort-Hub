// Account-free load posting: a carrier or broker fills one form, confirms by email, and the load goes live.
// Nothing is posted until the email link is clicked, so nobody can post in another person's name.
import { createHash, createHmac, randomBytes } from 'crypto'

export const SITE = 'https://www.oversize-escort-hub.com'

const STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO',
  'MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
])
export const POSITIONS = ['Lead', 'Chase', 'High Pole', 'Lineman', 'Rear Steer', 'Survey', 'Flagger'] as const
export const BOARDS = ['flat-rate', 'open-bid'] as const

// Limits that keep one person from flooding the board
export const LIMITS = { perIpHour: 5, perIpDay: 15, perEmailDay: 3, perDayAll: 150, openLoadsPerAccount: 5, draftHours: 24, passwordWindowMin: 30 }

export type QuickPostInput = {
  email: string
  name: string
  company: string
  phone: string
  pickupCity: string
  pickupState: string
  destinationCity: string
  destinationState: string
  escortType: (typeof POSITIONS)[number]
  escortCount: number
  boardType: (typeof BOARDS)[number]
  rate: number
  dateNeeded: string | null
  notes: string
}

// Throwaway inboxes are how spam gets in. Real carriers use a work or personal address.
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
  'fakeinbox.com', 'mailnesia.com', 'mintemail.com', 'moakt.com', 'tempail.com', 'emailondeck.com', 'burnermail.io', 'mohmal.com',
])
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return DISPOSABLE.has(domain)
}
/** Links, emails or phone numbers in the notes are how people dodge the confirm step or advertise. */
export function hasContactInfo(text: string): boolean {
  return /(https?:\/\/|www\.|@|\b[a-z0-9-]+\.(com|net|org|io|co|us|ca|biz|info|me|ly|app|xyz)\b)/i.test(text) || /\d[\d\s().-]{7,}\d/.test(text)
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '')

export function validateQuickPost(body: unknown): { ok: true; data: QuickPostInput } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const email = clean(b.email, 200).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Enter a valid email address' }
  const name = clean(b.name, 80)
  if (name.length < 2) return { ok: false, error: 'Enter your name' }
  const company = clean(b.company, 120)
  const phone = clean(b.phone, 30).replace(/[^\d+()\-.\s]/g, '')
  const pickupCity = clean(b.pickupCity, 80), destinationCity = clean(b.destinationCity, 80)
  const pickupState = clean(b.pickupState, 2).toUpperCase(), destinationState = clean(b.destinationState, 2).toUpperCase()
  if (!pickupCity || !destinationCity) return { ok: false, error: 'Enter the pickup and destination cities' }
  if (!STATES.has(pickupState) || !STATES.has(destinationState)) return { ok: false, error: 'Pick a state or province for both ends' }
  const escortType = POSITIONS.find((p) => p === b.escortType)
  if (!escortType) return { ok: false, error: 'Pick the escort position you need' }
  const escortCount = Math.round(Number(b.escortCount ?? 1))
  if (!Number.isFinite(escortCount) || escortCount < 1 || escortCount > 6) return { ok: false, error: 'Escorts needed must be 1 to 6' }
  const boardType = BOARDS.find((x) => x === b.boardType)
  if (!boardType) return { ok: false, error: 'Pick flat rate or open bid' }
  const rate = Number(b.rate)
  if (!Number.isFinite(rate) || rate < 0.5 || rate > 50) return { ok: false, error: 'Enter a rate per mile between $0.50 and $50' }
  let dateNeeded: string | null = null
  if (typeof b.dateNeeded === 'string' && b.dateNeeded) {
    const t = Date.parse(b.dateNeeded + 'T00:00:00Z')
    const today = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
    if (!Number.isFinite(t) || t < today || t - today > 120 * 86400000) return { ok: false, error: 'Pick a date from today to 120 days out' }
    dateNeeded = b.dateNeeded.slice(0, 10)
  }
  const notes = clean(b.notes, 500)
  if (hasContactInfo(notes)) return { ok: false, error: 'Please take links, emails and phone numbers out of the notes. Contact details are shared only after a match.' }
  if (isDisposableEmail(email)) return { ok: false, error: 'Please use a work or personal email, not a temporary one.' }
  return { ok: true, data: { email, name, company, phone, pickupCity, pickupState, destinationCity, destinationState, escortType, escortCount, boardType, rate, dateNeeded, notes } }
}

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  return { token, hash: hashToken(token) }
}
export function hashToken(token: string): string {
  return createHash('sha256').update(String(token)).digest('hex')
}
export function hashIp(ip: string): string {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'no-key').update(`ip:${ip}`).digest('hex').slice(0, 32)
}
export function clientIp(headers: Headers): string {
  return (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || 'unknown'
}
/** Escapes % and _ so an email is matched exactly by ilike. */
export function ilikeExact(email: string): string {
  return email.replace(/[\\%_]/g, (c) => '\\' + c)
}
