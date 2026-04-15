const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  P_EVO_MEMBER: 'price_1TF00LLmfugPCRbAl6sF0Oup',
  P_EVO_PRO: 'price_1TF021LmfugPCRbA7CGgLhC0',
  BGC_BADGE: 'price_1TF0EILmfugPCRbAvM6Q5rhW',
  SPONSORED_ZONE: 'price_1TLSu3LmfugPCRbAsumfZjCf',
};

export async function createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: priceId === PRICE_IDS.BGC_BADGE ? 'payment' : 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: '', // Will be set by caller
      metadata: {
        userId,
      },
    });
    return session;
  } catch (error) {
    throw error;
  }
}

export async function createCoupon(percentOff: number, durationInMonths: number) {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: durationInMonths > 0 ? 'repeating' : 'forever',
      duration_in_months: durationInMonths || undefined,
    });
    return coupon;
  } catch (error) {
    throw error;
  }
}

export function getPriceId(product: string): string {
  return PRICE_IDS[product as keyof typeof PRICE_IDS] || '';
}

export const STRIPE_PRICE_IDS = PRICE_IDS;
