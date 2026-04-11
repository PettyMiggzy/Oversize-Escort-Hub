import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    async function sendSMS(phone: string, body: string) {
      const apiKey = process.env.TEXTREQUEST_API_KEY!
        const accountId = process.env.TEXTREQUEST_ACCOUNT_ID!
          await fetch('https://api.textrequest.com/api/Messages', {
              method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
                      body: JSON.stringify({ AccountId: accountId, Contact: { PhoneNumber: phone }, Body: body })
                        })
                        }

                        export async function POST(req: NextRequest) {
                          const body = await req.json()
                            const { loadId, pickup, destination, date, certs, rate, pickupState, deliveryState } = body

                              // Update pro_window_expires_at on the load (5-min PRO exclusive window)
                                const proExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString()
                                  await svc.from('loads').update({ pro_window_expires_at: proExpiry }).eq('id', loadId)

                                    // Build SMS message body
                                      const certsStr = Array.isArray(certs) ? certs.join(', ') : (certs || '')
                                        const proMsg = `OEH NEW LOAD: ${pickup} \u2192 ${destination} | ${date} | ${certsStr} | ${rate} \u2014 5-min PRO exclusive. Login: oversize-escort-hub.com`
                                          const memberMsg = `OEH NEW LOAD: ${pickup} \u2192 ${destination} | ${date} | ${certsStr} | ${rate}. Login: oversize-escort-hub.com`

                                            // Fetch opted-out phone numbers
                                              const { data: optOuts } = await svc.from('sms_opt_outs').select('phone')
                                                const optOutSet = new Set((optOuts || []).map((r: any) => r.phone))

                                                  // Helper: check if escort's notification_states matches this load's states
                                                    function stateMatches(notifStates: string[] | null, pickup: string, delivery: string): boolean {
                                                        if (!notifStates || notifStates.length === 0) return true // no preference = all loads
                                                            return notifStates.includes(pickup) || notifStates.includes(delivery)
                                                              }

                                                                // Fetch PRO escorts with phone (immediate send)
                                                                  const { data: proEscorts } = await svc
                                                                      .from('profiles')
                                                                          .select('phone, full_name, notification_states')
                                                                              .eq('tier', 'pro')
                                                                                  .eq('role', 'escort')
                                                                                      .not('phone', 'is', null)

                                                                                        let proSent = 0
                                                                                          for (const escort of (proEscorts || [])) {
                                                                                              if (optOutSet.has(escort.phone)) continue
                                                                                                  if (!stateMatches(escort.notification_states, pickupState || '', deliveryState || '')) continue
                                                                                                      try { await sendSMS(escort.phone, proMsg); proSent++ } catch {}
                                                                                                        }

                                                                                                          // Fetch MEMBER escorts with phone (send after 60-second delay)
                                                                                                            const { data: memberEscorts } = await svc
                                                                                                                .from('profiles')
                                                                                                                    .select('phone, full_name, notification_states')
                                                                                                                        .eq('tier', 'member')
                                                                                                                            .eq('role', 'escort')
                                                                                                                                .not('phone', 'is', null)

                                                                                                                                  // Fire-and-forget member sends with 60s delay
                                                                                                                                    ;(async () => {
                                                                                                                                        await new Promise(r => setTimeout(r, 60_000))
                                                                                                                                            for (const escort of (memberEscorts || [])) {
                                                                                                                                                  if (optOutSet.has(escort.phone)) continue
                                                                                                                                                        if (!stateMatches(escort.notification_states, pickupState || '', deliveryState || '')) continue
                                                                                                                                                              try { await sendSMS(escort.phone, memberMsg) } catch {}
                                                                                                                                                                  }
                                                                                                                                                                    })()

                                                                                                                                                                      return NextResponse.json({ sent: proSent, proExpiry })
                                                                                                                                                                      }