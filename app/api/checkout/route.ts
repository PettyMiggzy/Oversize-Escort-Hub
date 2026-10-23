import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createCheckoutSession, getVeteranCouponId, STRIPE_PRICE_IDS } from '@/lib/stripe-utils';
import { createClient } from '@/lib/supabase/server';
import { FREE_LAUNCH } from '@/lib/free-launch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: bodyEmail, priceId: rawPriceId, zone } = body;

    // Buyer must be signed in so the webhook can set profiles.tier / flags on a real account.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in before checkout' }, { status: 401 });
    }
    const userId = user.id;
    const email = user.email ?? (typeof bodyEmail === 'string' ? bodyEmail.trim().slice(0, 200) : undefined);

    if (!rawPriceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Callers may send either a real Stripe price id ("price_...") or one of our
    // internal product keys ("P_EVO_MEMBER", "FLEET_PRO", ...). Resolve keys to
    // real price ids; pass real price ids through unchanged.
    const priceId =
      STRIPE_PRICE_IDS[rawPriceId as keyof typeof STRIPE_PRICE_IDS] || rawPriceId;

    // only our own products can be bought here
    if (typeof priceId !== 'string' || !Object.values(STRIPE_PRICE_IDS).includes(priceId)) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
    }

    // Free launch: plans and review fees are not sold; only sponsored zones can be bought
    if (FREE_LAUNCH && priceId !== STRIPE_PRICE_IDS.SPONSORED_ZONE) {
      return NextResponse.json({ error: 'Everything is free while we launch. No payment needed.' }, { status: 403 });
    }

    // Sponsored zone one-time buy requires a state or the webhook inserts nothing
    if (priceId === STRIPE_PRICE_IDS.SPONSORED_ZONE) {
      const z = typeof zone === 'string' ? zone.trim().toUpperCase() : ''
      if (!z || z.length < 2) {
        return NextResponse.json({ error: 'Pick a sponsored zone (state)' }, { status: 400 })
      }
    }

    // Approved DD-214 veterans get 30% off subscription checkouts
    let couponId: string | undefined
    const oneTime = [
      STRIPE_PRICE_IDS.BGC_BADGE,
      STRIPE_PRICE_IDS.SPONSORED_ZONE,
      STRIPE_PRICE_IDS.PEVO_MEMBER_REVIEW,
      STRIPE_PRICE_IDS.PEVO_PRO_REVIEW,
    ].includes(priceId)
    if (!oneTime) {
      const svc = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: vet } = await svc
        .from('veteran_discounts')
        .select('discount_percentage')
        .eq('user_id', userId)
        .limit(1)
      if (vet?.length) {
        const pct = Number(vet[0].discount_percentage) || 30
        couponId = await getVeteranCouponId(pct)
      }
    }

    const origin = req.headers.get('origin') || 'https://oversize-escort-hub.com';
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || origin}/dashboard?upgraded=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || origin}/pricing`;

    const session = await createCheckoutSession(
      userId,
      priceId,
      successUrl,
      cancelUrl,
      email,
      typeof zone === 'string' ? zone.trim().toUpperCase() : zone,
      couponId ? { couponId } : undefined
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
