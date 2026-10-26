import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Derived from shared STRIPE_PRICE_IDS so all routes agree on price -> tier mapping
// Subscription prices only — one-time products (BGC, sponsored zone, cert review)
// must never appear here or subscription.* events would overwrite profiles.tier.
const PRICE_TO_TIER: Record<string, string> = {
  [STRIPE_PRICE_IDS.P_EVO_MEMBER]: 'member',
  [STRIPE_PRICE_IDS.P_EVO_PRO]: 'pro',
  [STRIPE_PRICE_IDS.FLEET_STARTER]: 'fleet_starter',
  [STRIPE_PRICE_IDS.FLEET_PLUS]: 'fleet_plus',
  [STRIPE_PRICE_IDS.FLEET_PRO]: 'fleet_pro',
}

const BGC_PRICE = 'price_1TF0EILmfugPCRbAvM6Q5rhW'
const SPONSORED_PRICE = 'price_1UUdxgLmfugPCRbA7JaQsyIY'

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

/** Fail the webhook (non-2xx) so Stripe retries when a paid write does not land. */
function writeFailed(label: string, error: { message?: string } | null) {
  console.error(`[stripe webhook] ${label}`, error)
  return NextResponse.json({ error: label }, { status: 500 })
}

const FLEET_TIERS = ['fleet_starter', 'fleet_plus', 'fleet_pro']

// Fleet plans make an account a fleet manager. The role it had before is remembered, so cancelling puts it back
// (a carrier stays a carrier) instead of turning everyone into an escort.
async function roleForPlan(userId: string, tier: string): Promise<Record<string, unknown>> {
  const { data: existing } = await supabase.from('profiles').select('role, prior_role').eq('id', userId).maybeSingle()
  if (FLEET_TIERS.includes(tier)) {
    if (existing?.role === 'fleet_manager') return {}
    return { role: 'fleet_manager', prior_role: existing?.role ?? 'escort' }
  }
  if (existing?.role === 'fleet_manager') return { role: existing.prior_role ?? 'escort', prior_role: null }
  return {}
}

// A subscription that has ended: back to the base plan, and only for the profile that holds this subscription.
async function endSubscription(subscriptionId: string): Promise<NextResponse | null> {
  const { data: rows } = await supabase
    .from('profiles')
    .select('id, role, prior_role')
    .eq('stripe_subscription_id', subscriptionId)
  for (const row of rows || []) {
    const patch: Record<string, unknown> = { tier: 'trial', stripe_subscription_id: null }
    if (row.role === 'fleet_manager') { patch.role = row.prior_role ?? 'escort'; patch.prior_role = null }
    const { error } = await supabase.from('profiles').update(patch).eq('id', row.id)
    if (error) return writeFailed('subscription deleted tier update', error)
  }
  return null
}

// The price actually charged on a checkout session (its metadata is only a hint and can disagree).
async function chargedPriceId(session: Stripe.Checkout.Session): Promise<string | null> {
  const inline = session.line_items?.data?.[0]?.price?.id
  if (inline) return inline
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
    return items.data[0]?.price?.id ?? null
  } catch {
    return null
  }
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
    // Not paid (and not a free trial start): nothing is granted yet
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      console.error('[stripe webhook] checkout session not paid, nothing granted', { sessionId: session.id, status: session.payment_status })
      return NextResponse.json({ received: true })
    }
    const priceId = (await chargedPriceId(session)) ?? ((session.metadata?.priceId as string | undefined) ?? null)
    const clientRef = session.client_reference_id ?? null
    const email = session.customer_details?.email ?? session.customer_email ?? null

    const userId = await resolveUserId(metaUserId, clientRef, email)

    if (!userId || !priceId) {
      console.error('[stripe webhook] could not resolve userId/priceId', {
        metaUserId, clientRef, email, priceId, sessionId: session.id,
      })
      // Unknown buyer — ACK so Stripe does not retry forever; ops must reconcile.
      return NextResponse.json({ received: true })
    }

    // BGC one-time purchase
    if (priceId === BGC_PRICE) {
      const { error } = await supabase.from('profiles').update({ bgc_paid: true }).eq('id', userId)
      if (error) return writeFailed('bgc_paid update', error)
      return NextResponse.json({ received: true })
    }

    // Sponsored zone one-time purchase
    if (priceId === SPONSORED_PRICE) {
      const zone = (session.metadata?.zone as string | undefined) ?? null
      if (zone) {
        const { error } = await supabase.from('sponsored_zones').insert({
          user_id: userId,
          zone: zone.trim().toUpperCase(),
          active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        if (error) return writeFailed('sponsored_zones insert', error)
      } else {
        console.error('[stripe webhook] sponsored zone missing metadata.zone', { sessionId: session.id })
      }
      return NextResponse.json({ received: true })
    }

    // One-time P/EVO cert-review purchase: mark paid only. Do NOT touch the
    // subscription tier or stripe_subscription_id (this is a payment-mode
    // session with no subscription).
    if (priceId === STRIPE_PRICE_IDS.PEVO_MEMBER_REVIEW || priceId === STRIPE_PRICE_IDS.PEVO_PRO_REVIEW) {
      const { error } = await supabase.from('profiles').update({ pevo_paid: true }).eq('id', userId)
      if (error) return writeFailed('pevo_paid update', error)
      return NextResponse.json({ received: true })
    }

    // Subscription tier upgrade — only for known subscription prices.
    // Never default an unknown price to 'member' (that would mis-tier any
    // one-time or unrecognized purchase).
    const tier = PRICE_TO_TIER[priceId]
    if (!tier) {
      console.error('[stripe webhook] unknown priceId on checkout.session.completed', { priceId, sessionId: session.id })
      return NextResponse.json({ received: true })
    }
    const profilePatch: Record<string, unknown> = {
      tier,
      stripe_customer_id: (session.customer as string) ?? null,
      stripe_subscription_id: (session.subscription as string) ?? null,
      ...(await roleForPlan(userId, tier)),
    }
    const { error: tierErr } = await supabase.from('profiles').update(profilePatch).eq('id', userId)
    if (tierErr) return writeFailed('tier update', tierErr)

    return NextResponse.json({ received: true })
  }

  // ── customer.subscription.deleted ─────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const failed = await endSubscription(sub.id)
    if (failed) return failed
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

    // Only a live subscription grants a plan. An ended one is treated as a cancellation; a payment that is late or
    // not finished grants nothing new and leaves the account as it is.
    if (sub.status !== 'active' && sub.status !== 'trialing') {
      if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
        const failed = await endSubscription(sub.id)
        if (failed) return failed
      }
      return NextResponse.json({ received: true })
    }

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

    const tier = PRICE_TO_TIER[priceId]
    const profilePatch: Record<string, unknown> = {
      tier,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      ...(await roleForPlan(userId, tier)),
    }
    const { error } = await supabase.from('profiles').update(profilePatch).eq('id', userId)
    if (error) return writeFailed('subscription sync tier update', error)
  }

  return NextResponse.json({ received: true })
}
