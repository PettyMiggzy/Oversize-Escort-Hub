import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  try {
    const body = await req.json()
    const { deadhead_destination_city, deadhead_destination_state } = body
    if (!deadhead_destination_city || !deadhead_destination_state) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('loads')
      .update({ deadhead_destination_city, deadhead_destination_state })
      .eq('id', (await params).id)
      .eq('carrier_id', user!.id)
      .select('id')
    if (error) return NextResponse.json({ error: 'Could not update the load' }, { status: 500 })
    if (!data?.length) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
