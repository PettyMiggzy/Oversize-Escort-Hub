import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/bids?load_id=<uuid>
// Returns bids for the given load, ordered by rate ASC (lowest first).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const load_id = searchParams.get('load_id')
    if (!load_id) {
      return NextResponse.json({ error: 'Missing load_id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('load_id', load_id)
      .order('rate', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, bids: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
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
    const note: string | null = typeof body?.note === 'string' ? body.note : null

    if (!load_id) {
      return NextResponse.json({ error: 'Missing load_id' }, { status: 400 })
    }
    const rate = Number(rawRate)
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: 'Invalid rate' }, { status: 400 })
    }

    // Verify load exists and is open + on the bid board
    const { data: load, error: loadErr } = await supabase
      .from('loads')
      .select('id, status, board_type')
      .eq('id', load_id)
      .single()
    if (loadErr || !load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }
    if (load.status !== 'open') {
      return NextResponse.json({ error: 'Load not open for bidding' }, { status: 409 })
    }
    if (load.board_type !== 'bid' && load.board_type !== 'open') {
      return NextResponse.json({ error: 'Load is not biddable' }, { status: 409 })
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

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, bid: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
