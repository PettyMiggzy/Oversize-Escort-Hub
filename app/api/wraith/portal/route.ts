import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/service-client'
import { wraithCustomerId } from '@/lib/wraith-access'
import { wraithLive } from '@/lib/wraith'

export const dynamic = 'force-dynamic'

// Manage or cancel Wraith Pro. Always the signed-in person's own subscription.
export async function POST(req: Request) {
  if (!wraithLive()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const customer = await wraithCustomerId(serviceClient(), user.id)
  if (!customer) return NextResponse.json({ error: 'No Wraith Pro subscription found.' }, { status: 404 })
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://www.oversize-escort-hub.com'
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
    const s = await stripe.billingPortal.sessions.create({ customer, return_url: `${origin}/wraith` })
    return NextResponse.json({ url: s.url })
  } catch (e) {
    console.error('[wraith portal]', e)
    return NextResponse.json({ error: 'Could not open the billing page. Try again.' }, { status: 500 })
  }
}
