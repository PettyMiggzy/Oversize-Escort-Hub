import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { requireAuth } from '@/lib/api-auth'


export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const { error: __authErr } = await requireAuth()
  if (__authErr) return __authErr
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails('mailto:support@oversize-escort-hub.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
    }
  } catch (e) { /* VAPID not configured */ }

  const { pickupState, loadId, pickup, destination, date, certs, rate } = await req.json()
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // Find all Member escorts in matching state
  const { data: escorts } = await svc
    .from('profiles')
    .select('id')
    .eq('role', 'escort')
    .eq('tier', 'member')
    .contains('availability_states', pickupState ? [pickupState] : [])
  if (!escorts || escorts.length === 0) return NextResponse.json({ sent: 0 })
  let sent = 0
  for (const escort of escorts) {
    try {
      const { data: row } = await svc.from('push_subscriptions').select('subscription').eq('user_id', escort.id).single()
      if (!row) continue
      await webpush.sendNotification(row.subscription, JSON.stringify({
        title: 'OEH: New Load Available',
        body: `${pickup} → ${destination} | ${date} | ${rate}`,
        url: '/'
      }))
      sent++
    } catch {}
  }
  return NextResponse.json({ sent })
}
