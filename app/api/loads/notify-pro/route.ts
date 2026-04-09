import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export const dynamic = 'force-dynamic'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Called after a load is posted to notify Pro escorts first (5-min exclusive window)
export async function POST(req: NextRequest) {
  const { load_id, zone, cert_type } = await req.json();
  if (!load_id) return NextResponse.json({ error: "load_id required" }, { status: 400 });

  // Fetch Pro escorts matching zone/cert
  let query = supabase
    .from("profiles")
    .select("id, push_token, full_name")
    .eq("tier", "pro")
    .eq("role", "escort")
    .not("push_token", "is", null);

  if (zone) query = query.eq("state", zone);
  if (cert_type) query = query.contains("cert_types", [cert_type]);

  const { data: proEscorts } = await query;
  if (!proEscorts?.length) return NextResponse.json({ notified: 0, tier: "pro" });

  // Send push to all matching Pro escorts
  const inserts = proEscorts.map((e: any) => ({
    token: e.push_token,
    title: "⭐ Pro Early Access — New Load",
    body: "A new load just posted. You have a 5-minute exclusive window before Members see it. Tap to view.",
    data: { load_id, type: "pro_early_access" },
  }));

  await supabase.from("push_queue").insert(inserts);

  // Schedule load to become visible to all after 5 minutes
  // This is handled by the loads table `visible_at` column (set on post)
  // The loads board filters: WHERE status='open' AND (visible_at IS NULL OR visible_at <= now())

  return NextResponse.json({ ok: true, notified: proEscorts.length, tier: "pro" });
}
