import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SMS_ENABLED } from '@/lib/features'
import { alertEscortBidAccepted, runAfter } from '@/lib/alerts'
import { sendSms } from '@/lib/twilio'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { load_id, bid_id } = await req.json()
    if (!load_id || !bid_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify caller is the carrier for this load
    const { data: load } = await supabase
      .from('loads')
      .select('carrier_id, status, dl_city, dl_state')
      .eq('id', load_id)
      .single()
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    if (load.carrier_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (load.status !== 'open') return NextResponse.json({ error: 'Load not available' }, { status: 409 })

    // The escort is whoever placed this bid on this load (never taken from the request)
    const { data: bid } = await supabase
      .from('bids')
      .select('id, escort_id, status')
      .eq('id', bid_id)
      .eq('load_id', load_id)
      .single()
    if (!bid || bid.status !== 'pending') return NextResponse.json({ error: 'Bid not available' }, { status: 409 })
    const escort_id = bid.escort_id as string

    // The database does not let a carrier write who a load is matched to, so these writes use the service key,
    // after the checks above (this is the load's carrier, and the bid is on this load).
    const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    // Take the load first: only one accept can win it
    const { data: taken, error: takeErr } = await svc
      .from('loads')
      .update({
        status: 'filled',
        matched_escort_id: escort_id,
        match_requested_at: new Date().toISOString(),
        deadhead_destination_city: load.dl_city,
        deadhead_destination_state: load.dl_state,
      })
      .eq('id', load_id)
      .eq('status', 'open')
      .select('id')
    if (takeErr) return NextResponse.json({ error: 'Could not accept the bid' }, { status: 500 })
    if (!taken?.length) return NextResponse.json({ error: 'Load not available' }, { status: 409 })

    // Accept this bid, reject the rest. Bids belong to the escort, so the database gives a carrier no update right on them:
    // the writes use the service key, after the checks above.
    const { data: accepted, error: acceptErr } = await svc
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bid_id)
      .eq('load_id', load_id)
      .eq('status', 'pending')
      .select('id')
    if (acceptErr || !accepted?.length) {
      // the bid was withdrawn or rejected in the meantime: put the load back so the carrier can choose again
      await svc.from('loads').update({ status: 'open', matched_escort_id: null, match_requested_at: null }).eq('id', load_id).eq('status', 'filled').eq('matched_escort_id', escort_id)
      if (acceptErr) return NextResponse.json({ error: 'Could not accept the bid' }, { status: 500 })
      return NextResponse.json({ error: 'Bid not available' }, { status: 409 })
    }

    await svc
      .from('bids')
      .update({ status: 'rejected' })
      .eq('load_id', load_id)
      .neq('id', bid_id)

    runAfter(() => alertEscortBidAccepted(load_id, escort_id))

    // Text the accepted escort once SMS is switched on (it stays off until SMS_ENABLED=true)
    if (SMS_ENABLED) {
      const { data: escort } = await svc
        .from('profiles')
        .select('phone')
        .eq('id', escort_id)
        .single()
      if (escort?.phone) {
        await sendSms(escort.phone, 'OEH: Your bid was accepted! Check the app for load details. https://oversize-escort-hub.com/dashboard')
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[bids accept]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
