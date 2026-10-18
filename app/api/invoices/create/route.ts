import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkTierAccess } from "@/lib/tier-access";

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await checkTierAccess(user.id, user.email ?? "", "member");
    if (!hasAccess) {
      return NextResponse.json({ error: "Member tier required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const load_id = typeof body.load_id === "string" ? body.load_id : "";
    const amount = Number(body.amount);
    const description = typeof body.description === "string" ? body.description.slice(0, 500) : null;
    const dueDate = typeof body.dueDate === "string" ? body.dueDate : null;
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];

    if (!load_id) return NextResponse.json({ error: "Load ID required" }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
    }

    // An invoice goes to the carrier of a load this escort was matched to, and to no one else
    const { data: load } = await supabase
      .from("loads")
      .select("carrier_id, matched_escort_id")
      .eq("id", load_id)
      .single();
    if (!load || load.matched_escort_id !== user.id || !load.carrier_id) {
      return NextResponse.json({ error: "You can only invoice a load you were matched to" }, { status: 403 });
    }

    const { data, error } = await supabase.from("invoices").insert({
      escort_id: user.id,
      carrier_id: load.carrier_id,
      amount,
      description,
      due_date: dueDate,
      items,
      status: "draft",
      created_at: new Date().toISOString(),
    }).select("id").single();

    if (error) throw error;

    return NextResponse.json({ success: true, invoiceId: data?.id });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: "Invoice creation failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .or(`escort_id.eq.${user.id},carrier_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
