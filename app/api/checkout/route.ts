import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/stripe-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, priceId, productType } = body;

    // priceId always required; userId/email optional for pre-signup anonymous checkout
    if (!priceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Carriers cannot check out for subscriptions
    const origin = req.headers.get('origin') || 'https://oversize-escort-hub.com';
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    const session = await createCheckoutSession(
      userId || null,
      priceId,
      successUrl,
      cancelUrl,
      email
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
