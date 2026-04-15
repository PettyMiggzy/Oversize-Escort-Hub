import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profile) return NextResponse.json({ received: true });

      const priceId = lineItems.data[0]?.price?.id;
      let tier = "trial";

      if (priceId === "price_1TF00LLmfugPCRbAl6sF0Oup") tier = "member";
      if (priceId === "price_1TF021LmfugPCRbA7CGgLhC0") tier = "pro";
      if (priceId === "price_1TF0EILmfugPCRbAvM6Q5rhW") tier = "bgc_badge_purchased";
      if (priceId === "price_1TLSu3LmfugPCRbAsumfZjCf") tier = "sponsored_zone";

      await supabase
        .from("profiles")
        .update({ tier, tier_updated_at: new Date().toISOString() })
        .eq("id", profile.id);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ tier: "trial" })
          .eq("id", profile.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
