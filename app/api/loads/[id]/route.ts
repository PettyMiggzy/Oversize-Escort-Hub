import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/supabase'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth: only the load's carrier (or an admin) may set its deadhead dest.
    const server = await createServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { deadhead_destination_city, deadhead_destination_state } = body
    if (!deadhead_destination_city || !deadhead_destination_state) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: load } = await svc.from('loads').select('carrier_id').eq('id', id).single()
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    if (load.carrier_id !== user.id && !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await svc
      .from('loads')
      .update({ deadhead_destination_city, deadhead_destination_state })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
