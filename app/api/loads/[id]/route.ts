import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { deadhead_destination_city, deadhead_destination_state } = body
    if (!deadhead_destination_city || !deadhead_destination_state) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { error } = await supabase
      .from('loads')
      .update({ deadhead_destination_city, deadhead_destination_state })
      .eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
