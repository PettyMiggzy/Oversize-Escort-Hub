import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { loadId, pickup, destination, date, certs, rate } = body
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Update pro_window_expires_at on the load
  const proExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  await svc.from('loads').update({ pro_window_expires_at: proExpiry }).eq('id', loadId)
  // Fetch all Pro escorts
  const { data: proEscorts } = await svc
    .from('profiles')
    .select('phone, full_name')
    .eq('tier', 'pro')
    .eq('role', 'escort')
    .not('phone', 'is', null)
  if (!proEscorts || proEscorts.length === 0) return NextResponse.json({ sent: 0 })
  const apiKey = process.env.TEXTREQUEST_API_KEY!
  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID!
  const certsStr = Array.isArray(certs) ? certs.join(', ') : (certs || '')
  const msgBody = `OEH NEW LOAD: ${pickup} → ${destination} | ${date} | ${certsStr} | ${rate} — 5-min exclusive. Login: oversize-escort-hub.com`
  let sent = 0
  for (const escort of proEscorts) {
    try {
      await fetch('https://api.textrequest.com/api/Messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify({ AccountId: accountId, Contact: { PhoneNumber: escort.phone }, Body: msgBody })
      })
      sent++
    } catch {}
  }
  return NextResponse.json({ sent, proExpiry })
}
