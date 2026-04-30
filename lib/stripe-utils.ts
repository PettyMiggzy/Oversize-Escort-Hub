import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const PRICE_IDS = {
  P_EVO_MEMBER: 'price_1TF00LLmfugPCRbAl6sF0Oup',
  P_EVO_PRO: 'price_1TF021LmfugPCRbA7CGgLhC0',
  BGC_BADGE: 'price_1TF0EILmfugPCRbAvM6Q5rhW',
  SPONSORED_ZONE: 'price_1TLSu3LmfugPCRbAsumfZjCf',
  FLEET_STARTER: process.env.NEXT_PUBLIC_FLEET_STARTER_PRICE_ID || 'price_1TMUvjLmfugPCRbAa1HHd7f3',
  FLEET_PLUS: process.env.NEXT_PUBLIC_FLEET_PLUS_PRICE_ID || 'price_1TMUwaLmfugPCRbAxwDBbslg',
  FLEET_PRO: process.env.NEXT_PUBLIC_FLEET_PRO_PRICE_ID || 'price_1TMT9fLmfugPCRbA0Tu65Ui0',
  PEVO_MEMBER_REVIEW: 'price_1TF0D4LmfugPCRbAd4hMO22R',
  PEVO_PRO_REVIEW: 'price_1TF0DiLmfugPCRbAPWsN2K5x',
}

const ONE_TIME_PRICES: string[] = [
  PRICE_IDS.BGC_BADGE,
  'price_1TF0D4LmfugPCRbAd4hMO22R',
  'price_1TF0DiLmfugPCRbAPWsN2K5x',
]

export async function createCheckoutSession(
  userId: string | null,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string,
  zone?: string
) {
  const isOneTime = ONE_TIME_PRICES.includes(priceId)

  // Build metadata. Always include priceId so the webhook can route the
  // event without consulting Stripe again. userId may be null for the
  // pre-signup flow; in that case we rely on customer_email to reconcile.
  const metadata: Record<string, string> = { priceId }
  if (userId) metadata.userId = userId
  if (zone) metadata.zone = zone

  const params: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isOneTime ? 'payment' : 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    // Subscription-mode sessions support subscription_data.metadata which
    // gets copied to the resulting Subscription object — so the
    // customer.subscription.* webhook events can also see priceId/userId.
    ...(isOneTime ? {} : { subscription_data: { metadata } }),
    // Stripe forwards client_reference_id on checkout.session.completed.
    // Use it as a robust user-id channel that survives even if metadata is
    // dropped or rewritten by an extension.
    ...(userId ? { client_reference_id: userId } : {}),
    ...(customerEmail ? { customer_email: customerEmail } : {}),
  }

  return stripe.checkout.sessions.create(params)
}

export async function createCoupon(percentOff: number, durationInMonths: number) {
  return stripe.coupons.create({
    percent_off: percentOff,
    duration: durationInMonths > 0 ? 'repeating' : 'forever',
    duration_in_months: durationInMonths || undefined,
  })
}

export function getPriceId(product: string): string {
  return PRICE_IDS[product as keyof typeof PRICE_IDS] || ''
}

export const STRIPE_PRICE_IDS = PRICE_IDS
