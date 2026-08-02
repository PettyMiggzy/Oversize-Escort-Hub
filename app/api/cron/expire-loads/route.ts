export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Expire open, non-biddable loads past their window. Bid/open-bid loads stay
  // acceptable after their bidding window closes so the carrier can still pick.
  await supabase.from('loads').update({ status: 'expired' })
    .lt('expires_at', now).eq('status', 'open')
    .neq('board_type', 'bid').neq('board_type', 'open-bid')

  // Release stale pending_match holds (escort claimed, carrier never responded)
  // back onto the open board after 1 hour.
  await supabase.from('loads')
    .update({ status: 'open', matched_escort_id: null, match_requested_at: null })
    .eq('status', 'pending_match').lt('match_requested_at', oneHourAgo)

  return NextResponse.json({ ok: true, expired_at: now })
}
