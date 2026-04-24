import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'


export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Derived from shared STRIPE_PRICE_IDS so all routes agree on price -> tier mapping
const PRICE_TO_TIER: Record<string, string> = {
  [STRIPE_PRICE_IDS.P_EVO_MEMBER]: 'member',
  [STRIPE_PRICE_IDS.P_EVO_PRO]: 'pro',
  [STRIPE_PRICE_IDS.FLEET_STARTER]: 'fleet_starter',
  [STRIPE_PRICE_IDS.FLEET_PLUS]: 'fleet_plus',
  [STRIPE_PRICE_IDS.FLEET_PRO]: 'fleet_pro',
  [STRIPE_PRICE_IDS.SPONSORED_ZONE]: 'sponsored_zone',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const priceId = session.metadata?.priceId
    if (!userId || !priceId) return NextResponse.json({ received: true })

    if (priceId === 'price_1TF0EILmfugPCRbAvM6Q5rhW') {
      await supabase.from('profiles').update({ bgc_verified: true }).eq('id', userId)
      return NextResponse.json({ received: true })
    }

    if (priceId === 'price_1TLSu3LmfugPCRbAsumfZjCf') {
      const zone = session.metadata?.zone
      if (zone && userId) {
        await supabase.from('sponsored_zones').insert({
          user_id: userId,
          state: zone,
          active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
      return NextResponse.json({ received: true })
    }
    await supabase.from('profiles').update({
      tier: PRICE_TO_TIER[priceId] ?? 'member',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('profiles').update({ tier: 'trial' }).eq('stripe_subscription_id', sub.id)
  }

    // Handle subscription created/updated — update tier for P/EVO escorts only
      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
          const sub = event.data.object as Stripe.Subscription
              const priceId = sub.items?.data?.[0]?.price?.id
                  if (priceId && PRICE_TO_TIER[priceId]) {
                        await supabase.from('profiles').update({
                                tier: PRICE_TO_TIER[priceId],
                                        stripe_subscription_id: sub.id,
                                                stripe_customer_id: sub.customer as string,
                                                      }).eq('stripe_subscription_id', sub.id)
                                                          }
                                                            }
                                                            

  return NextResponse.json({ received: true })
}