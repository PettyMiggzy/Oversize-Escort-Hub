import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notifyProEscorts } from '@/lib/notify-pro'
import { notifyDeadhead } from '@/lib/deadhead'

export const dynamic = 'force-dynamic'

/**
 * Carrier-authenticated hook after a direct loads insert (SPA post-load path).
 * Runs the same Pro early-access + deadhead notify as POST /api/loads.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const loadId = typeof body.load_id === 'string' ? body.load_id : ''
  if (!loadId) return NextResponse.json({ error: 'load_id required' }, { status: 400 })

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: load } = await svc
    .from('loads')
    .select('id, carrier_id, pu_state, dl_state')
    .eq('id', loadId)
    .maybeSingle()
  if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
  if (load.carrier_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const [deadhead, pro] = await Promise.allSettled([
    notifyDeadhead(loadId),
    notifyProEscorts({
      load_id: loadId,
      pu_state: load.pu_state,
      dl_state: load.dl_state,
    }),
  ])

  return NextResponse.json({
    ok: true,
    deadhead: deadhead.status === 'fulfilled' ? deadhead.value : { error: true },
    pro: pro.status === 'fulfilled' ? pro.value : { error: true },
  })
}
