import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/service-client'
import { createCheckoutSession } from '@/lib/stripe-utils'
import { hasWraithAccess, wraithPriceId } from '@/lib/wraith-access'
import { wraithLive } from '@/lib/wraith'

export const dynamic = 'force-dynamic'

// Start the Wraith Pro subscription. Website only: the price comes from our own setting, never from the request.
export async function POST(req: Request) {
  if (!wraithLive()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const priceId = wraithPriceId()
  if (!priceId) return NextResponse.json({ error: 'Wraith Pro is not on sale yet.' }, { status: 503 })
  if (await hasWraithAccess(serviceClient(), user.id, user.email)) return NextResponse.json({ error: 'You already have Wraith Pro.' }, { status: 409 })
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://www.oversize-escort-hub.com'
    const session = await createCheckoutSession(user.id, priceId, `${origin}/wraith?subscribed=1`, `${origin}/wraith`, user.email ?? undefined)
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[wraith checkout]', e)
    return NextResponse.json({ error: 'Could not start checkout. Try again.' }, { status: 500 })
  }
}
