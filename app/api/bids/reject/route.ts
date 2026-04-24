import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bid_id, load_id } = await req.json()
    if (!bid_id || !load_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: load } = await supabase
      .from('loads')
      .select('carrier_id')
      .eq('id', load_id)
      .single()
    if (!load || load.carrier_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('id', bid_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
