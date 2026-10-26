export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCron } from '@/lib/api-auth'
import { sendWebPushToUser } from '@/lib/push'
import { CHECKIN_AFTER_MS, NO_EXPIRY_MAX_AGE_MS, sendCheckinEmail } from '@/lib/load-lifecycle'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const CHECKINS_PER_RUN = 15 // Resend allows about two sends a second; the rest go out on the next run (every 5 minutes)
const HOLD_MS = 60 * 60 * 1000 // a match request the carrier hasn't answered is released after an hour

// Vercel Cron (every 5 minutes, vercel.json) sends Authorization: Bearer CRON_SECRET.
// 1) closes open loads past their expiry, 2) releases unanswered match requests back to the board.
export async function GET(req: Request) {
  const denied = requireCron(req)
  if (denied) return denied

  const now = new Date().toISOString()

  const { error: expErr } = await supabase.from('loads').update({ status: 'expired' }).lt('expires_at', now).eq('status', 'open')
  if (expErr) console.error('[cron expire-loads] expire failed:', expErr)

  // a post with no expiry at all (made straight against the database) still comes down after a day
  const { error: oldErr } = await supabase.from('loads').update({ status: 'expired' }).is('expires_at', null).lt('created_at', new Date(Date.now() - NO_EXPIRY_MAX_AGE_MS).toISOString()).eq('status', 'open')
  if (oldErr) console.error('[cron expire-loads] no-expiry sweep failed:', oldErr)

  // 12 hours on the board: ask the poster once whether to keep it up. Bid-board loads live five minutes, so they never get here.
  let checkins = 0
  const { data: aging, error: ageErr } = await supabase
    .from('loads')
    .select('id, carrier_id, pu_city, pu_state, dl_city, dl_state, created_at, relisted_at')
    .eq('status', 'open')
    .is('checkin_sent_at', null)
    .neq('board_type', 'bid')
    .gt('expires_at', now)
    .lt('created_at', new Date(Date.now() - CHECKIN_AFTER_MS).toISOString())
    .limit(CHECKINS_PER_RUN)
  if (ageErr) console.error('[cron expire-loads] check-in lookup failed:', ageErr)
  for (const l of (aging ?? []) as { id: string; carrier_id: string; pu_city: string; pu_state: string; dl_city: string; dl_state: string; created_at: string; relisted_at: string | null }[]) {
    // a relisted load is asked again 12 hours after it went back up, not 12 hours after it was first posted
    const since = Date.parse(l.relisted_at || l.created_at)
    if (Date.now() - since < CHECKIN_AFTER_MS) continue
    const { data: claimed } = await supabase.from('loads').update({ checkin_sent_at: now }).eq('id', l.id).eq('status', 'open').is('checkin_sent_at', null).select('id')
    if (!claimed?.length) continue // another run took it
    const { data: owner } = await supabase.from('profiles').select('email, suspended').eq('id', l.carrier_id).maybeSingle()
    if (!owner?.email || owner.suspended) continue
    await sendCheckinEmail(owner.email, l, (Date.now() - since) / 3600000)
    try { await supabase.from('notifications').insert({ user_id: l.carrier_id, message: `Still need escorts for ${l.pu_city}, ${l.pu_state} to ${l.dl_city}, ${l.dl_state}? Keep it up or take it down from your dashboard.` }) } catch {}
    checkins += 1
  }

  const heldBefore = new Date(Date.now() - HOLD_MS).toISOString()
  const { data: held, error: heldErr } = await supabase
    .from('loads')
    .select('id, matched_escort_id')
    .eq('status', 'pending_match')
    .lt('match_requested_at', heldBefore)
  if (heldErr) console.error('[cron expire-loads] holds failed:', heldErr)

  let released = 0
  for (const load of held ?? []) {
    // only the hold we read: a newer claim on the same load, or one the carrier already accepted, is left alone
    const { data: reopened, error: reErr } = await supabase
      .from('loads')
      .update({ status: 'open', matched_escort_id: null, match_requested_at: null })
      .eq('id', load.id)
      .eq('status', 'pending_match')
      .eq('matched_escort_id', load.matched_escort_id)
      .lt('match_requested_at', heldBefore)
      .select('id')
    if (reErr) { console.error('[cron expire-loads] reopen failed:', reErr); continue }
    if (!reopened?.length) continue
    released += 1
    if (load.matched_escort_id) {
      await sendWebPushToUser(load.matched_escort_id, {
        title: 'Match Expired',
        body: 'The carrier did not respond in time. The load is back on the board.',
        url: `/loads/${load.id}`,
        data: { load_id: load.id, type: 'match_expired' },
      })
    }
  }

  return NextResponse.json({ ok: !expErr && !heldErr && !oldErr && !ageErr, expired_at: now, released, checkins })
}
