import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendSMS(phone: string, body: string) {
  const apiKey = process.env.TEXTREQUEST_API_KEY!
  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID!
  await fetch(`https://api.textrequest.com/api/v3/Messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({ AccountId: accountId, Contact: { PhoneNumber: phone }, Body: body })
  })
}

export async function POST(req: NextRequest) {
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
      .single()

    if (!load) return NextResponse.json({ sent: 0 })

    // Get Pro escorts
    const { data: proEscorts } = await svc
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'escort')
      .eq('membership', 'pro')

    if (!proEscorts || proEscorts.length === 0) return NextResponse.json({ sent: 0 })

    // Get zones for each pro escort, filter by pickup/destination state
    const pu_state = load.pu_state || ''
    const dl_state = load.dl_state || ''

    let sent = 0
    for (const escort of proEscorts) {
      if (!escort.phone) continue

      // Check if escort covers pickup state
      const { data: zones } = await svc
        .from('escort_availability')
        .select('state')
        .eq('escort_id', escort.id)

      const escortStates = (zones || []).map((z: any) => z.state)
      if (pu_state && !escortStates.includes(pu_state)) continue

      const msg = `New OEH Load: ${load.escort_type || load.escort_types?.[0] || 'Escort'} needed. ${load.pu_city || ''}, ${pu_state} → ${load.dl_city || ''}, ${dl_state}. Rate: $${load.rate || '?'}. View: oversize-escort-hub.com/loads/${load.id}`

      try { await sendSMS(escort.phone, msg); sent++ } catch {}
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('SMS route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
