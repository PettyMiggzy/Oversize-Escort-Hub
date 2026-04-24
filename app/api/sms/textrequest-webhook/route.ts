import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

export const dynamic = 'force-dynamic'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify TextRequest webhook HMAC signature (16g)
    function verifySignature(body: string, signature: string | null): boolean | null {
      // true=valid, false=invalid, null=cannot verify (skip)
      const secret = process.env.TEXTREQUEST_WEBHOOK_SECRET
      if (!secret) return null
      if (!signature) return null
      try {
        const expected = createHmac('sha256', secret).update(body).digest('hex')
        return expected === signature
      } catch {
        return null
      }
            }

            // POST /api/sms/textrequest-webhook — handles inbound SMS from TextRequest (16f)
            export async function POST(req: NextRequest) {
              const rawBody = await req.text()
                const sig = req.headers.get('x-textrequest-signature')

                  // Signature verification (16g) — only 401 when we CAN verify AND sig is wrong.
                  // TextRequest may not send a signature header; missing secret/header must NOT 401.
                    const sigResult = verifySignature(rawBody, sig)
                    if (sigResult === false) {
                        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
                          }

                            let parsed: any
                              try { parsed = JSON.parse(rawBody) } catch {
                                  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
                                    }

                                      const phone: string = parsed?.From || parsed?.from || ''
                                        const messageText: string = (parsed?.Body || parsed?.body || '').trim().toUpperCase()

                                          if (!phone) return NextResponse.json({ ok: true })

                                            // Handle STOP — add to opt-out list
                                              if (messageText === 'STOP' || messageText === 'UNSUBSCRIBE') {
                                                  await svc.from('sms_opt_outs').upsert({ phone }, { onConflict: 'phone' })
                                                      return NextResponse.json({ ok: true, action: 'opted_out' })
                                                        }

                                                          // Handle START / UNSTOP — remove from opt-out list
                                                            if (messageText === 'START' || messageText === 'UNSTOP') {
                                                                await svc.from('sms_opt_outs').delete().eq('phone', phone)
                                                                    return NextResponse.json({ ok: true, action: 'opted_in' })
                                                                      }

                                                                        // Handle HELP — send info message back via TextRequest
                                                                          if (messageText === 'HELP') {
                                                                              const apiKey = process.env.TEXTREQUEST_API_KEY!
                                                                                  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID!
                                                                                      await fetch('https://api.textrequest.com/api/Messages', {
                                                                                            method: 'POST',
                                                                                                  headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
                                                                                                        body: JSON.stringify({
                                                                                                                AccountId: accountId,
                                                                                                                        Contact: { PhoneNumber: phone },
                                                                                                                                Body: 'OEH Alerts: Reply STOP to unsubscribe from load notifications. Reply START to re-subscribe. Visit oversize-escort-hub.com for support.'
                                                                                                                                      })
                                                                                                                                          })
                                                                                                                                              return NextResponse.json({ ok: true, action: 'help_sent' })
                                                                                                                                                }

                                                                                                                                                  return NextResponse.json({ ok: true })
                                                                                                                                                  }