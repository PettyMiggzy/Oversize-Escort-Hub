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
          const customerEmail = session.customer_details?.email;
              const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                  const priceId = lineItems.data[0]?.price?.id;

                      if (!customerEmail || !priceId) return NextResponse.json({ received: true });

                          const updateData: Record<string, unknown> = { tier_updated_at: new Date().toISOString() };

                              if (priceId === "price_1TF0D4LmfugPCRbAd4hMO22R") {
                                    updateData.membership = "member";
                                          updateData.role = "escort";
                                              } else if (priceId === "price_1TF0DiLmfugPCRbAPWsN2K5x") {
                                                    updateData.membership = "pro";
                                                          updateData.role = "escort";
                                                              } else if (priceId === "price_1TMT9fLmfugPCRbA0Tu65Ui0") {
                                                                    updateData.membership = "fleet_pro";
                                                                          updateData.role = "fleet";
                                                                              } else if (priceId === "price_1TF0EILmfugPCRbAvM6Q5rhW") {
                                                                                    updateData.bgc_verified = true;
                                                                                        } else if (priceId === "price_1TLSu3LmfugPCRbAsumfZjCf") {
                                                                                              updateData.sponsored_zone = true;
                                                                                                  }

                                                                                                      await supabase
                                                                                                            .from("profiles")
                                                                                                                  .update(updateData)
                                                                                                                        .eq("email", customerEmail);
                                                                                                                          }
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
