export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireCron } from '@/lib/api-auth'
import { sendWebPushToUser } from '@/lib/push'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const HOLD_MS = 60 * 60 * 1000 // a match request the carrier hasn't answered is released after an hour

// Vercel Cron (every 5 minutes, vercel.json) sends Authorization: Bearer CRON_SECRET.
// 1) closes open loads past their expiry, 2) releases unanswered match requests back to the board.
export async function GET(req: Request) {
  const denied = requireCron(req)
  if (denied) return denied

  const now = new Date().toISOString()

  const { error: expErr } = await supabase.from('loads').update({ status: 'expired' }).lt('expires_at', now).eq('status', 'open')
  if (expErr) console.error('[cron expire-loads] expire failed:', expErr)

  const heldBefore = new Date(Date.now() - HOLD_MS).toISOString()
  const { data: held, error: heldErr } = await supabase
    .from('loads')
    .select('id, matched_escort_id')
    .eq('status', 'pending_match')
    .lt('match_requested_at', heldBefore)
  if (heldErr) console.error('[cron expire-loads] holds failed:', heldErr)

  let released = 0
  if (held?.length) {
    const ids = held.map((l: any) => l.id)
    const { error: reErr } = await supabase
      .from('loads')
      .update({ status: 'open', matched_escort_id: null, match_requested_at: null })
      .in('id', ids)
      .eq('status', 'pending_match')
    if (reErr) console.error('[cron expire-loads] reopen failed:', reErr)
    else released = ids.length

    if (!reErr) {
      for (const load of held) {
        if (!load.matched_escort_id) continue
        await sendWebPushToUser(load.matched_escort_id, {
          title: 'Match Expired',
          body: 'The carrier did not respond in time. The load is back on the board.',
          url: `/loads/${load.id}`,
          data: { load_id: load.id, type: 'match_expired' },
        })
      }
    }
  }

  return NextResponse.json({ ok: !expErr && !heldErr, expired_at: now, released })
}
