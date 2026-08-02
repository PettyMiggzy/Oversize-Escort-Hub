import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const svc = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Save this device's push subscription for the signed-in user.
// The user id comes from the session, NOT the request body (the client only
// sends { subscription }, so requiring a body userId always 400'd).
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const { subscription } = await req.json()
  if (!subscription) return NextResponse.json({ error: 'missing subscription' }, { status: 400 })
  const { error: dbErr } = await svc()
    .from('push_subscriptions')
    .upsert({ user_id: user!.id, subscription }, { onConflict: 'user_id' })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Remove this user's push subscription (called by the /push unsubscribe button).
export async function DELETE() {
  const { user, error } = await requireAuth()
  if (error) return error
  const { error: dbErr } = await svc()
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user!.id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
