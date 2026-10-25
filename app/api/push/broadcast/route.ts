import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const FIVE_MIN = 5 * 60 * 1000
// loads already broadcast by this server instance (best effort against repeated calls)
const done = new Set<string>()

// Tells Member escorts about the caller's own newest open load once the Pro head start (5 minutes) is over.
// The words and the state come from the load itself, never from the request, so no one can push their own
// text to other users.
export async function POST(_req: NextRequest) {
  const { user, error: __authErr } = await requireAuth()
  if (__authErr) return __authErr
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails('mailto:support@oversize-escort-hub.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
    }
  } catch (e) { /* VAPID not configured */ }

  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: load } = await svc
    .from('loads')
    .select('id, pu_city, pu_state, dl_city, dl_state, start_date, per_mile_rate, status, created_at')
    .eq('carrier_id', user!.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!load || !load.pu_state) return NextResponse.json({ sent: 0 })

  // the Pro head start must be over, and one broadcast per load
  if (Date.now() - Date.parse(load.created_at) < FIVE_MIN - 15_000) return NextResponse.json({ sent: 0, reason: 'too_early' })
  if (done.has(load.id)) return NextResponse.json({ sent: 0, reason: 'already_sent' })
  done.add(load.id)

  const puState = String(load.pu_state).toUpperCase()

  // Members who listed this state on profiles.availability_states OR escort_availability
  const { data: byProfile } = await svc
    .from('profiles')
    .select('id')
    .eq('role', 'escort')
    .eq('tier', 'member')
    .contains('availability_states', [puState])

  const { data: byTable } = await svc
    .from('escort_availability')
    .select('escort_id')
    .eq('location_state', puState)

  const memberIds = new Set((byProfile || []).map((e: { id: string }) => e.id))
  const availEscortIds = [...new Set((byTable || []).map((r: any) => r.escort_id).filter(Boolean))]
  if (availEscortIds.length) {
    const { data: memberAvail } = await svc
      .from('profiles')
      .select('id')
      .eq('role', 'escort')
      .eq('tier', 'member')
      .in('id', availEscortIds)
    for (const m of memberAvail || []) memberIds.add(m.id)
  }

  if (memberIds.size === 0) return NextResponse.json({ sent: 0 })

  const rate = load.per_mile_rate ? `$${load.per_mile_rate}/mi` : ''
  const payload = JSON.stringify({
    title: 'OEH: New Load Available',
    body: `${load.pu_city}, ${load.pu_state} → ${load.dl_city}, ${load.dl_state} | ${load.start_date ?? ''} | ${rate}`,
    url: '/',
  })

  const ids = [...memberIds]
  const { data: subs } = await svc.from('push_subscriptions').select('subscription').in('user_id', ids)
  let sent = 0
  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(row.subscription, payload)
      sent++
    } catch {}
  }
  return NextResponse.json({ sent })
}
