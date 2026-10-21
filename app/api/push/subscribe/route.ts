import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'


export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const { user, error: __authErr } = await requireAuth()
  if (__authErr) return __authErr
  const { subscription } = await req.json()
  const userId = user!.id
  if (!subscription) return NextResponse.json({ error: 'missing params' }, { status: 400 })
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await svc.from('push_subscriptions').upsert({ user_id: userId, subscription }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: 'Could not save the subscription' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// /push unsubscribe sends DELETE with { endpoint }; remove this user's stored subscription
export async function DELETE(_req: NextRequest) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await svc.from('push_subscriptions').delete().eq('user_id', user!.id)
  if (error) return NextResponse.json({ error: 'Could not remove the subscription' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
