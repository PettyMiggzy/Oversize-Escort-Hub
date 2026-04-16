import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { message, audience } = await req.json()
    if (!message || message.length > 160) return NextResponse.json({ error: 'Invalid message' }, { status: 400 })

    let query = supabase.from('profiles').select('phone').eq('sms_opt_in', true).not('phone', 'is', null)
    if (audience === 'pro') query = query.in('tier', ['pro', 'fleet_pro'])
    else if (audience === 'carriers') query = query.eq('role', 'carrier')
    else if (audience === 'members') query = query.eq('tier', 'member')

    const { data: profiles, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const accountId = process.env.TEXTREQUEST_ACCOUNT_ID
    const apiKey = process.env.TEXTREQUEST_API_KEY
    let sent = 0

    for (const p of (profiles || [])) {
      if (!p.phone) continue
      try {
        await fetch(`https://app.textrequest.com/api/v2/accounts/${accountId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey! },
          body: JSON.stringify({ contact_phone: p.phone, message })
        })
        sent++
      } catch (_) {}
    }

    return NextResponse.json({ success: true, sent, total: profiles?.length ?? 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
