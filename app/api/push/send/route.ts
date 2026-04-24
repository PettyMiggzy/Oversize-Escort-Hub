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

  const { userId, title, body, url } = await req.json()
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: row } = await svc.from('push_subscriptions').select('subscription').eq('user_id', userId).single()
  if (!row) return NextResponse.json({ error: 'no subscription' }, { status: 404 })
  try {
    await webpush.sendNotification(row.subscription, JSON.stringify({ title, body, url }))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
