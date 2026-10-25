import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { SMS_ENABLED, smsComingSoon } from '@/lib/features'
import { sendSms } from '@/lib/twilio'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!SMS_ENABLED) return smsComingSoon()
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  const { matchId, escortId } = await req.json()
    if (!matchId || !escortId) return NextResponse.json({ ok: false }, { status: 400 })
      const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: load } = await svc.from('loads').select('carrier_id, matched_escort_id').eq('id', matchId).single()
    if (!load || load.carrier_id !== user!.id || load.matched_escort_id !== escortId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
        const { data: profile } = await svc.from('profiles').select('phone, full_name').eq('id', escortId).single()
          if (!profile?.phone) return NextResponse.json({ ok: false, error: 'no phone' })
            const optOut = await svc.from('sms_opt_outs').select('id').eq('phone', profile.phone).maybeSingle()
              if (optOut.data) return NextResponse.json({ ok: false, error: 'opted out' })
                const msg = `Hi ${profile.full_name || 'there'}, great news! A carrier has confirmed your match on Oversize Escort Hub. Log in to view contact details and coordinate your run. Reply STOP to unsubscribe.`
                  const sent = await sendSms(profile.phone, msg)
                                      return NextResponse.json({ ok: sent })
                                      }