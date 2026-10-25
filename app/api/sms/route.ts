import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { SMS_ENABLED, smsComingSoon } from '@/lib/features'
import { sendSms } from '@/lib/twilio'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (!SMS_ENABLED) return smsComingSoon()
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  try {
    const { loadId } = await req.json()
    if (!loadId) return NextResponse.json({ error: 'loadId required' }, { status: 400 })

    // Get the load
    const { data: load } = await svc
      .from('loads')
      .select('*')
      .eq('id', loadId)
      .eq('board_type', 'bid')
      .eq('status', 'open')
      .eq('carrier_id', user!.id)
      .single()

    if (!load) return NextResponse.json({ sent: 0 })

    // Get Pro escorts
    const { data: proEscorts } = await svc
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'escort')
      .eq('tier', 'pro')

    if (!proEscorts || proEscorts.length === 0) return NextResponse.json({ sent: 0 })

    // Get zones for each pro escort, filter by pickup/destination state
    const pu_state = load.pu_state || ''
    const dl_state = load.dl_state || ''

    let sent = 0
    for (const escort of proEscorts) {
      if (!escort.phone) continue
      const { data: optOut } = await svc.from('sms_opt_outs').select('id').eq('phone', escort.phone).maybeSingle()
      if (optOut) continue

      // Check if escort covers pickup state
      const { data: zones } = await svc
        .from('escort_availability')
        .select('location_state')
        .eq('escort_id', escort.id)

      const escortStates = (zones || []).map((z: any) => z.location_state)
      if (pu_state && !escortStates.includes(pu_state)) continue

      const msg = `New OEH Load: ${load.escort_type || load.escort_types?.[0] || 'Escort'} needed. ${load.pu_city || ''}, ${pu_state} → ${load.dl_city || ''}, ${dl_state}. Rate: $${load.per_mile_rate ?? '?'}. View: oversize-escort-hub.com/loads/${load.id}`

      if (await sendSms(escort.phone, msg)) sent++
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('SMS route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
