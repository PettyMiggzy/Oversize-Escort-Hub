import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";


export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });

export async function POST(req: NextRequest) {
  const { user_id, email } = await req.json();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Background Check Badge", description: "OEH Background Check Verification — $9.99 one-time" },
        unit_amount: 999,
      },
      quantity: 1,
    }],
    customer_email: email,
    metadata: { user_id, type: "bgc" },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify?bgc=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify?bgc=cancel`,
  });
  return NextResponse.json({ url: session.url });
}
