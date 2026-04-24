import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { load_id, bid_id, escort_id } = await req.json()
    if (!load_id || !bid_id || !escort_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify caller is the carrier for this load
    const { data: load } = await supabase
      .from('loads')
      .select('carrier_id, status, title')
      .eq('id', load_id)
      .single()
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    if (load.carrier_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (load.status !== 'open') return NextResponse.json({ error: 'Load not available' }, { status: 409 })

    // Accept this bid
    const { error: acceptErr } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bid_id)
    if (acceptErr) return NextResponse.json({ error: acceptErr.message }, { status: 500 })

    // Reject all other bids for this load
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('load_id', load_id)
      .neq('id', bid_id)

    // Update load to filled, matched to escort
    await supabase
      .from('loads')
      .update({
        status: 'filled',
        matched_escort_id: escort_id,
        match_requested_at: new Date().toISOString(),
      })
      .eq('id', load_id)

    // Send SMS to accepted escort via TextRequest (same pattern as /api/sms)
    const { data: escort } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', escort_id)
      .single()

    if (escort?.phone) {
      const apiKey = process.env.TEXTREQUEST_API_KEY
      const accountId = process.env.TEXTREQUEST_ACCOUNT_ID
      if (apiKey && accountId) {
        await fetch('https://api.textrequest.com/api/v3/Messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
          body: JSON.stringify({
            AccountId: accountId,
            Contact: { PhoneNumber: escort.phone },
            Body: `OEH: Your bid was accepted! Check the app for load details. https://oversize-escort-hub.com/dashboard`,
          }),
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
