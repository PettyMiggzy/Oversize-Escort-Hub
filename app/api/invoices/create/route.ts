import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkTierAccess } from "@/lib/tier-access";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await checkTierAccess(user.id, user.email ?? "", "member");
    if (!hasAccess) {
      return NextResponse.json({ error: "Member tier required" }, { status: 403 });
    }

    // Accept the fields the invoices page actually sends (load_id, amount,
    // recipient_email) plus the older superset for backward-compat.
    const body = await req.json();
    const { load_id, recipient_email, carrierId, amount, description, dueDate, items } = body;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        escort_id: user.id,
        carrier_id: carrierId ?? null,
        load_id: load_id ?? null,
        recipient_email: recipient_email ?? null,
        amount,
        description: description ?? null,
        due_date: dueDate ?? null,
        items: items || [],
        status: "draft",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      invoiceId: data?.id,
      downloadUrl: `/api/invoices/${data?.id}/pdf`,
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: "Invoice creation failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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
