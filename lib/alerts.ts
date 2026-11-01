// Email + in-app alerts for loads, bids and matches. Every send is best effort: a failed email never fails the action
// that caused it. Each email carries a signed unsubscribe link, and people who opted out (profiles.email_alerts = false)
// still get the in-app notification but no email.
import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { sendEmail } from '@/lib/email'
import { sendWebPushToUser } from '@/lib/push'

const SITE = 'https://www.oversize-escort-hub.com'
// Resend allows about two sends a second; the cap keeps one new load inside a serverless function's time limit
const MAX_LOAD_RECIPIENTS = 80
const SEND_GAP_MS = 550
const URGENT_MAX_RECIPIENTS = 40

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/** Runs work after the response is sent; outside a request (tests, scripts) it just runs it. */
export function runAfter(fn: () => Promise<unknown>) {
  try { after(fn) } catch { void fn().catch(() => {}) }
}

export function unsubToken(userId: string): string {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'no-key').update(`unsub:${userId}`).digest('hex')
}
export function verifyUnsubToken(userId: string, token: string): boolean {
  if (!userId || !token) return false
  const a = Buffer.from(unsubToken(userId)), b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

type Alert = { subject: string; headline: string; body: string; path: string }
type Person = { id: string; email: string | null; full_name: string | null; suspended: boolean | null; email_alerts: boolean | null }

function render(a: Alert, p: Person) {
  const link = `${SITE}${a.path}`
  const unsub = `${SITE}/api/alerts/unsubscribe?u=${p.id}&t=${unsubToken(p.id)}`
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
<h2 style="margin:0 0 12px">${esc(a.headline)}</h2>
<p style="font-size:15px;line-height:1.5">${esc(a.body)}</p>
<p style="margin:20px 0"><a href="${link}" style="background:#f0a500;color:#000;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Open in Oversize Escort Hub</a></p>
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px">
<p style="font-size:12px;color:#666">You get this because you have an Oversize Escort Hub account. <a href="${unsub}">Stop these emails</a>.</p></div>`
}

async function deliver(client: ReturnType<typeof svc>, p: Person, a: Alert): Promise<boolean> {
  if (!p.email || p.suspended) return false
  try { await client.from('notifications').insert({ user_id: p.id, message: `${a.headline}: ${a.body}`.slice(0, 500) }) } catch {}
  if (p.email_alerts === false) return false
  return sendEmail({ to: p.email, subject: a.subject, html: render(a, p) })
}

const PERSON_COLS = 'id, email, full_name, suspended, email_alerts'

async function alertUser(userId: string, a: Alert) {
  const client = svc()
  const { data: p } = await client.from('profiles').select(PERSON_COLS).eq('id', userId).maybeSingle()
  if (p) await deliver(client, p as Person, a)
}

const line = (l: any) => `${l?.pu_city || '?'}, ${l?.pu_state || '?'} to ${l?.dl_city || '?'}, ${l?.dl_state || '?'}`

async function getLoad(loadId: string) {
  const { data } = await svc().from('loads').select('id, carrier_id, matched_escort_id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, start_date, urgent, regulars_until, status, expires_at').eq('id', loadId).maybeSingle()
  return data as any
}

/** A new load went up: tell escorts who cover its states (or have not set any states yet). */
export async function alertEscortsNewLoad(loadId: string) {
  const load = await getLoad(loadId)
  if (!load) return { sent: 0 }
  const client = svc()
  const { data: escorts } = await client.from('profiles')
    .select(`${PERSON_COLS}, availability_states`)
    .eq('role', 'escort')
    .neq('id', load.carrier_id)
  const wanted = [load.pu_state, load.dl_state].filter(Boolean).map((s: string) => s.toUpperCase())
  const who = (escorts || []).filter((e: any) => {
    const states: string[] = (e.availability_states || []).map((s: string) => String(s).toUpperCase())
    return !states.length || wanted.some((w: string) => states.includes(w))
  }).slice(0, MAX_LOAD_RECIPIENTS)
  const rate = load.per_mile_rate != null ? ` Pays $${load.per_mile_rate}/mile.` : ''
  const a: Alert = {
    subject: `New load: ${line(load)}`,
    headline: 'New load posted',
    body: `${line(load)}.${rate} Be first to claim it.`,
    path: `/loads/${loadId}`,
  }
  let sent = 0
  for (const e of who as any[]) {
    if (await deliver(client, e as Person, a)) sent++
    await sleep(SEND_GAP_MS)
  }
  return { sent, considered: who.length }
}

/** The carrier's regulars hear about a load first. Their window may still be running, which is the point. */
export async function alertRegularsNewLoad(loadId: string) {
  const load = await getLoad(loadId)
  if (!load?.carrier_id) return { sent: 0 }
  const client = svc()
  const { data: favs } = await client.from('favorite_escorts').select('escort_id').eq('carrier_id', load.carrier_id)
  const ids = (favs || []).map((f: any) => f.escort_id as string)
  if (!ids.length) return { sent: 0 }
  const { data: people } = await client.from('profiles').select(PERSON_COLS).in('id', ids)
  const mins = load.regulars_until ? Math.max(1, Math.ceil((Date.parse(load.regulars_until) - Date.now()) / 60000)) : 0
  const a: Alert = {
    subject: `${load.urgent ? 'URGENT, ' : ''}first look: ${line(load)}`,
    headline: load.urgent ? 'Urgent load, you get first look' : 'You get first look at a load',
    body: `${line(load)}.${mins ? ` A carrier you work with gave you about ${mins} minutes before it opens to everyone.` : ''} Be first to claim it.`,
    path: `/loads/${loadId}`,
  }
  let sent = 0
  for (const p of (people || []) as Person[]) {
    if (await deliver(client, p, a)) sent++
    try { await sendWebPushToUser(p.id, { title: a.headline, body: line(load), url: a.path }) } catch {}
    await sleep(SEND_GAP_MS)
  }
  return { sent, considered: ids.length }
}

/** An urgent load goes straight to escorts who said they are available in the pickup state (and to escorts who cover it). */
export async function alertUrgentLoad(loadId: string) {
  const load = await getLoad(loadId)
  if (!load || !load.urgent || load.status !== 'open') return { sent: 0 }
  const client = svc()
  const state = String(load.pu_state || '').toUpperCase()
  const { data: avail } = await client.from('escort_availability').select('escort_id, expires_at').eq('location_state', state)
  const nowIso = new Date().toISOString()
  const onToday = new Set((avail || []).filter((x: any) => !x.expires_at || x.expires_at > nowIso).map((x: any) => x.escort_id as string))
  const { data: escorts } = await client.from('profiles').select(`${PERSON_COLS}, availability_states`).eq('role', 'escort').neq('id', load.carrier_id)
  const who = (escorts || []).filter((e: any) => onToday.has(e.id) || (e.availability_states || []).map((s: string) => String(s).toUpperCase()).includes(state)).slice(0, URGENT_MAX_RECIPIENTS)
  const a: Alert = {
    subject: `URGENT: escort needed now: ${line(load)}`,
    headline: 'Urgent: a carrier needs an escort now',
    body: `${line(load)}.${load.per_mile_rate != null ? ` Pays $${load.per_mile_rate}/mile.` : ''} Claim it before someone else does.`,
    path: `/loads/${loadId}`,
  }
  let sent = 0
  for (const e of who as any[]) {
    if (await deliver(client, e as Person, a)) sent++
    try { await sendWebPushToUser(e.id, { title: a.headline, body: line(load), url: a.path }) } catch {}
    await sleep(SEND_GAP_MS)
  }
  return { sent, considered: who.length }
}

/** Alerts that waited for a regulars-first window to end: the cron calls this every few minutes. */
export async function sendDeferredLoadAlerts(limit = 5) {
  const client = svc()
  const nowIso = new Date().toISOString()
  const { data: due } = await client.from('loads').select('id, status, urgent, expires_at')
    .eq('alerts_pending', true).or(`regulars_until.is.null,regulars_until.lt.${nowIso}`).limit(limit)
  let handled = 0
  for (const l of (due || []) as any[]) {
    // take it first so two runs never send twice
    const { data: taken } = await client.from('loads').update({ alerts_pending: false }).eq('id', l.id).eq('alerts_pending', true).select('id')
    if (!taken?.length) continue
    handled++
    if (l.status !== 'open' || (l.expires_at && Date.parse(l.expires_at) <= Date.now())) continue
    await alertEscortsNewLoad(l.id)
    if (l.urgent) await alertUrgentLoad(l.id)
  }
  return { handled }
}

export async function alertCarrierNewBid(loadId: string, rate: number | string) {
  const load = await getLoad(loadId)
  if (load?.carrier_id) await alertUser(load.carrier_id, {
    subject: `New bid on your load: ${line(load)}`, headline: 'New bid on your load',
    body: `An escort bid $${rate} on ${line(load)}. Review it and accept or pass.`, path: '/dashboard',
  })
}
export async function alertEscortBidAccepted(loadId: string, escortId: string) {
  const load = await getLoad(loadId)
  await alertUser(escortId, {
    subject: `Your bid was accepted: ${line(load)}`, headline: 'Your bid was accepted',
    body: `The carrier accepted your bid on ${line(load)}. Open the load for the details.`, path: `/loads/${loadId}`,
  })
}
export async function alertCarrierClaimRequest(loadId: string) {
  const load = await getLoad(loadId)
  if (load?.carrier_id) await alertUser(load.carrier_id, {
    subject: `An escort wants your load: ${line(load)}`, headline: 'An escort requested your load',
    body: `An escort claimed ${line(load)}. Accept or decline from your dashboard.`, path: '/dashboard',
  })
}
export async function alertEscortMatch(loadId: string, escortId: string, accepted: boolean) {
  const load = await getLoad(loadId)
  await alertUser(escortId, accepted
    ? { subject: `Match accepted: ${line(load)}`, headline: 'Match accepted', body: `The carrier accepted you for ${line(load)}. Open the load for the details.`, path: `/loads/${loadId}` }
    : { subject: `Match declined: ${line(load)}`, headline: 'Match declined', body: `The carrier passed on your request for ${line(load)}. The load is back on the board.`, path: `/loads/${loadId}` })
}

/** First sign-in after sign-up: one friendly email that says what to do next. Sent once per account. */
export async function alertWelcome(userId: string) {
  const client = svc()
  const { data: p } = await client.from('profiles').select(`${PERSON_COLS}, role`).eq('id', userId).maybeSingle()
  if (!p) return false
  const { data: done } = await client.from('notifications').select('id').eq('user_id', userId).ilike('message', 'Welcome to Oversize Escort Hub%').limit(1)
  if (done && done.length > 0) return false
  const role = (p as any).role as string | null
  const escort = role === 'escort'
  const a: Alert = {
    subject: 'Welcome to Oversize Escort Hub',
    headline: 'Welcome to Oversize Escort Hub',
    body: escort
      ? 'Add the states you cover and your vehicle, then watch the boards. When a load goes up in your states you get an email, and you can claim it or bid.'
      : 'Post your first load in under two minutes. Escorts in your states are alerted the moment it goes up, and you see every bid on your dashboard.',
    path: escort ? '/dashboard' : '/post-load',
  }
  // The notification row doubles as the "already welcomed" marker; welcome emails ignore the alerts opt-out only for this one message
  return deliver(client, p as Person, a)
}

/** Monday digest: new open loads from the last 7 days in each escort's states. Sends nothing to escorts with nothing new. */
export async function alertWeeklyDigest() {
  const client = svc()
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: loads } = await client.from('loads')
    .select('id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, created_at')
    .eq('status', 'open').gte('created_at', since).order('created_at', { ascending: false }).limit(200)
  if (!loads || loads.length === 0) return { sent: 0, considered: 0, loads: 0 }
  const { data: escorts } = await client.from('profiles')
    .select(`${PERSON_COLS}, availability_states`).eq('role', 'escort').limit(2000)
  let sent = 0, considered = 0
  for (const e of (escorts || []) as any[]) {
    if (!e.email || e.suspended || e.email_alerts === false) continue
    const states: string[] = (e.availability_states || []).map((s: string) => String(s).toUpperCase())
    const mine = (loads as any[]).filter((l) => !states.length || states.includes(String(l.pu_state).toUpperCase()) || states.includes(String(l.dl_state).toUpperCase()))
    if (mine.length === 0) continue
    if (considered >= MAX_LOAD_RECIPIENTS) break
    considered++
    const list = mine.slice(0, 5).map(line).join(' · ')
    const more = mine.length > 5 ? ` and ${mine.length - 5} more` : ''
    const a: Alert = {
      subject: `${mine.length} open load${mine.length === 1 ? '' : 's'} ${states.length ? 'in your states' : 'on the board'} this week`,
      headline: 'Open loads this week',
      body: `${list}${more}. Open the board to claim or bid.`,
      path: '/flat-rate',
    }
    if (await deliver(client, e as Person, a)) sent++
    await sleep(SEND_GAP_MS)
  }
  return { sent, considered, loads: loads.length }
}
