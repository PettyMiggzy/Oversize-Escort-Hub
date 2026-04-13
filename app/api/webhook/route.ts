import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// P/EVO escort tiers only — carriers are always free, never modified here
const PRICE_TO_TIER: Record<string, string> = {
  'price_1TF0D4LmfugPCRbAd4hMO22R': 'member',   // P/EVO Member $19.99/mo
    'price_1TF0DiLmfugPCRbAPWsN2K5x': 'pro',       // P/EVO Pro $29.99/mo
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
      await supabase.from('profiles').update({ bgc_pending: true }).eq('id', userId)
    } else {
      await supabase.from('profiles').update({
        tier: PRICE_TO_TIER[priceId] ?? 'member',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('profiles').update({ tier: 'free' }).eq('stripe_subscription_id', sub.id)
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