import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { escortAccess, claimRefusal } from '@/lib/access-server'

export const dynamic = 'force-dynamic'

// GET /api/bids?load_id=<uuid>
// The load's carrier gets every bid for the load (lowest rate first); anyone else gets only their own.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const load_id = searchParams.get('load_id')
    if (!load_id) {
      return NextResponse.json({ error: 'Missing load_id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: load } = await supabase.from('loads').select('carrier_id').eq('id', load_id).single()
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })

    let query = supabase.from('bids').select('*').eq('load_id', load_id)
    if (load.carrier_id !== user.id) query = query.eq('escort_id', user.id)
    const { data, error } = await query.order('rate', { ascending: true })

    if (error) return NextResponse.json({ error: 'Could not load the bids' }, { status: 500 })
    return NextResponse.json({ ok: true, bids: data ?? [] })
  } catch (err: any) {
    console.error('[bids GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/bids
// Body: { load_id, rate | bid_amount | bid_rate, note? }
// Inserts a pending bid for the authenticated escort.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({} as any))
    const load_id: string | undefined = body?.load_id
    const rawRate = body?.rate ?? body?.bid_amount ?? body?.bid_rate
    const note: string | null = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : null

    if (!load_id) {
      return NextResponse.json({ error: 'Missing load_id' }, { status: 400 })
    }
    const rate = Number(rawRate)
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100000) {
      return NextResponse.json({ error: 'Invalid rate' }, { status: 400 })
    }

    // Verify load exists and is open + on the bid board
    const { data: load, error: loadErr } = await supabase
      .from('loads')
      .select('id, status, board_type, carrier_id, created_at, expires_at')
      .eq('id', load_id)
      .single()
    if (loadErr || !load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }
    if (load.status !== 'open') {
      return NextResponse.json({ error: 'Load not open for bidding' }, { status: 409 })
    }
    if (load.expires_at && Date.parse(load.expires_at) <= Date.now()) {
      return NextResponse.json({ error: 'This load has closed' }, { status: 409 })
    }
    if (load.carrier_id === user.id) {
      return NextResponse.json({ error: 'You cannot bid on your own load' }, { status: 403 })
    }
    // Bid boards use several historical labels for the biddable types:
    // 'bid'/'5-min bid' and 'open'/'open-bid'. Accept all of them.
    if (!['bid', 'open', 'open-bid'].includes(load.board_type)) {
      return NextResponse.json({ error: 'Load is not biddable' }, { status: 409 })
    }

    // The plan rules (free locked out, Members after the Pro head start) are decided here, not only in the browser
    const refusal = claimRefusal(await escortAccess(supabase, user), load.created_at)
    if (refusal) return NextResponse.json({ error: refusal }, { status: 403 })

    // One live bid per escort per load
    const { data: existing } = await supabase
      .from('bids')
      .select('id')
      .eq('load_id', load_id)
      .eq('escort_id', user.id)
      .eq('status', 'pending')
      .limit(1)
    if (existing?.length) {
      return NextResponse.json({ error: 'You already have a bid on this load' }, { status: 409 })
    }

    const insertRow: Record<string, any> = {
      load_id,
      escort_id: user.id,
      rate,
      status: 'pending',
    }
    if (note) insertRow.note = note

    const { data: inserted, error: insErr } = await supabase
      .from('bids')
      .insert(insertRow)
      .select()
      .single()

    if (insErr) {
      console.error('[bids POST]', insErr)
      return NextResponse.json({ error: 'Could not place the bid' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, bid: inserted })
  } catch (err: any) {
    console.error('[bids POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
