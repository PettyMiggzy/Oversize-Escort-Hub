import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const enabled = Boolean(body.enabled)

  // Flip the profile flag
  const { error: flagErr } = await supabase
    .from('profiles')
    .update({ breakdown_protocol_enabled: enabled })
    .eq('id', user.id)
  if (flagErr) return NextResponse.json({ error: flagErr.message }, { status: 500 })

  if (enabled) {
    // Best-effort breakdown load auto-post.
    // Use escort's last filled load's dl_city/dl_state as their current location.
    const { data: lastLoad } = await supabase
      .from('loads')
      .select('dl_city, dl_state')
      .eq('matched_escort_id', user.id)
      .eq('status', 'filled')
      .not('dl_city', 'is', null)
      .not('dl_state', 'is', null)
      .order('match_requested_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (lastLoad?.dl_city && lastLoad?.dl_state) {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { data: bdLoad } = await supabase
        .from('loads')
        .insert([{
          carrier_id: user.id,
          pu_city: lastLoad.dl_city,
          pu_state: lastLoad.dl_state,
          dl_city: lastLoad.dl_city,
          dl_state: lastLoad.dl_state,
          escort_type: 'steer',
          escort_count: 1,
          board_type: 'flat-rate',
          load_type: 'breakdown',
          per_mile_rate: 0,
          rate: 0,
          notes: 'Breakdown assistance needed',
          expires_at: expires,
          pay_term: 'on_completion',
          status: 'open',
        }])
        .select()
        .single()
      return NextResponse.json({ ok: true, enabled, breakdown_load_id: bdLoad?.id ?? null })
    }
    return NextResponse.json({ ok: true, enabled, breakdown_load_id: null })
  } else {
    // Cancel the most recent open breakdown load posted by this user as carrier.
    const { data: openBd } = await supabase
      .from('loads')
      .select('id')
      .eq('carrier_id', user.id)
      .eq('load_type', 'breakdown')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (openBd?.id) {
      await supabase.from('loads').update({ status: 'cancelled' }).eq('id', openBd.id)
    }
    return NextResponse.json({ ok: true, enabled, cancelled_load_id: openBd?.id ?? null })
  }
}
