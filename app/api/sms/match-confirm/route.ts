import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Only the load's carrier may trigger the "match confirmed" SMS.
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  const { matchId, escortId } = await req.json()
    if (!matchId || !escortId) return NextResponse.json({ ok: false }, { status: 400 })
      const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      // matchId is the load id in the unified matching model; verify ownership.
      const { data: ownLoad } = await svc.from('loads').select('carrier_id').eq('id', matchId).single()
      if (!ownLoad || ownLoad.carrier_id !== user!.id) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
        const { data: profile } = await svc.from('profiles').select('phone, full_name').eq('id', escortId).single()
          if (!profile?.phone) return NextResponse.json({ ok: false, error: 'no phone' })
            const optOut = await svc.from('sms_opt_outs').select('id').eq('phone', profile.phone).maybeSingle()
              if (optOut.data) return NextResponse.json({ ok: false, error: 'opted out' })
                const msg = `Hi ${profile.full_name || 'there'}, great news! A carrier has confirmed your match on Oversize Escort Hub. Log in to view contact details and coordinate your run. Reply STOP to unsubscribe.`
                  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID
                    const apiKey = process.env.TEXTREQUEST_API_KEY
                      const res = await fetch(`https://app.textrequest.com/api/v2/accounts/${accountId}/messages`, {
                          method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey! },
                                  body: JSON.stringify({ contact_phone: profile.phone, message: msg })
                                    })
                                      return NextResponse.json({ ok: res.ok })
                                      }