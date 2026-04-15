import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const ADMIN_EMAILS = ["bahmed3170@gmail.com", "brian@precisionpilotservices.com"];

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email!)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { submissionId, action, userId } = await req.json();

    if (action === "approve") {
      await supabase
        .from("bgc_submissions")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", submissionId);

      await supabase
        .from("profiles")
        .update({ has_bgc_badge: true })
        .eq("id", userId);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: "price_1TF0EILmfugPCRbAvM6Q5rhW", quantity: 1 }],
        mode: "payment",
        customer_email: user.email,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?badge=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?badge=canceled`,
      });

      return NextResponse.json({ sessionId: session.id });
    }

    if (action === "deny") {
      await supabase
        .from("bgc_submissions")
        .update({ status: "denied", denied_reason: "Admin review" })
        .eq("id", submissionId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("BGC approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
