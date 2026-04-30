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

const BGC_PRICE = 'price_1TF0EILmfugPCRbAvM6Q5rhW'
const SPONSORED_PRICE = 'price_1TLSu3LmfugPCRbAsumfZjCf'

// Resolve a Supabase profile.id from whatever signal we have.
// Order: explicit userId metadata -> client_reference_id -> email lookup.
async function resolveUserId(
  metadataUserId: string | null | undefined,
  clientReferenceId: string | null | undefined,
  email: string | null | undefined
): Promise<string | null> {
  if (metadataUserId && metadataUserId !== 'null') return metadataUserId
  if (clientReferenceId) return clientReferenceId
  if (email) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (data?.id) return data.id
  }
  return null
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

  // ── checkout.session.completed ────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metaUserId = (session.metadata?.userId as string | undefined) ?? null
    const priceId = (session.metadata?.priceId as string | undefined) ?? null
    const clientRef = session.client_reference_id ?? null
    const email = session.customer_details?.email ?? session.customer_email ?? null

    const userId = await resolveUserId(metaUserId, clientRef, email)

    if (!userId || !priceId) {
      console.error('[stripe webhook] could not resolve userId/priceId', {
        metaUserId, clientRef, email, priceId, sessionId: session.id,
      })
      return NextResponse.json({ received: true })
    }

    // BGC one-time purchase
    if (priceId === BGC_PRICE) {
      await supabase.from('profiles').update({ bgc_paid: true }).eq('id', userId)
      return NextResponse.json({ received: true })
    }

    // Sponsored zone one-time purchase
    if (priceId === SPONSORED_PRICE) {
      const zone = (session.metadata?.zone as string | undefined) ?? null
      if (zone) {
        await supabase.from('sponsored_zones').insert({
          user_id: userId,
          state: zone,
          active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
      return NextResponse.json({ received: true })
    }

    // Subscription tier upgrade
    const tier = PRICE_TO_TIER[priceId] ?? 'member'
    const isPevo = priceId === 'price_1TF0DiLmfugPCRbAPWsN2K5x' || priceId === 'price_1TF0D4LmfugPCRbAd4hMO22R'
    const update: any = {
      tier,
      stripe_customer_id: (session.customer as string) ?? null,
      stripe_subscription_id: (session.subscription as string) ?? null,
    }
    if (isPevo) update.pevo_paid = true
    await supabase.from('profiles').update(update).eq('id', userId)

    return NextResponse.json({ received: true })
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('profiles').update({ tier: 'trial' }).eq('stripe_subscription_id', sub.id)
    return NextResponse.json({ received: true })
  }

  // ── customer.subscription.created / updated ───────────────────────────
  // Handles renewals, plan changes, and the rare case where
  // checkout.session.completed didn't fire (or failed to reconcile)
  // before this event.
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items?.data?.[0]?.price?.id
    if (!priceId || !PRICE_TO_TIER[priceId]) return NextResponse.json({ received: true })

    // 1) Try metadata.userId set by createCheckoutSession's subscription_data.
    let userId = (sub.metadata?.userId as string | undefined) ?? null

    // 2) Fall back to looking up the profile by stripe_subscription_id (renewals).
    if (!userId) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', sub.id)
        .maybeSingle()
      if (data?.id) userId = data.id
    }

    // 3) Last resort: look up the customer by email via Stripe.
    if (!userId && sub.customer) {
      try {
        const customer = await stripe.customers.retrieve(sub.customer as string)
        const email = (customer as Stripe.Customer).email
        if (email) {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle()
          if (data?.id) userId = data.id
        }
      } catch {
        // ignore — fall through to early return
      }
    }

    if (!userId) {
      console.error('[stripe webhook] sub event could not resolve userId', { subId: sub.id, priceId })
      return NextResponse.json({ received: true })
    }

    await supabase.from('profiles').update({
      tier: PRICE_TO_TIER[priceId],
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
    }).eq('id', userId)
  }

  return NextResponse.json({ received: true })
}
