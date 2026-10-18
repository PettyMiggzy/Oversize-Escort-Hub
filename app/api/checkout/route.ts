import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/stripe-utils';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: bodyEmail, priceId: rawPriceId, zone } = body;

    // A signed-in buyer is identified by the session, never by an id in the request: a body id would let one
    // person's purchase change another user's plan. Before sign-up (no session) the plan is matched by email.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;
    const email = user?.email ?? (typeof bodyEmail === 'string' ? bodyEmail.trim().slice(0, 200) : undefined);

    // priceId always required; userId/email optional for pre-signup anonymous checkout
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

    // Carriers cannot check out for subscriptions
    const origin = req.headers.get('origin') || 'https://oversize-escort-hub.com';
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || origin}/dashboard?upgraded=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || origin}/pricing`;

    const session = await createCheckoutSession(
      userId || null,
      priceId,
      successUrl,
      cancelUrl,
      email,
      zone
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
