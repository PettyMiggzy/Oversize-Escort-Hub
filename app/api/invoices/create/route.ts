import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { checkTierAccess } from "@/lib/tier-access";

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await checkTierAccess(user.id, user.email ?? "", "member");
    if (!hasAccess) {
      return NextResponse.json({ error: "Member tier required" }, { status: 403 });
    }

    const { carrierId, amount, description, dueDate, items } = await req.json();

    const { data, error } = await supabase.from("invoices").insert({
      escort_id: user.id,
      carrier_id: carrierId,
      amount,
      description,
      due_date: dueDate,
      items: items || [],
      status: "draft",
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      invoiceId: (data as any)?.[0]?.id,
      downloadUrl: `/api/invoices/${(data as any)?.[0]?.id}/pdf`,
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: "Invoice creation failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
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
