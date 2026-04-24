import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendSMS(phone: string, body: string) {
  const apiKey = process.env.TEXTREQUEST_API_KEY;
  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID;
  if (!apiKey || !accountId) return;
  await fetch(`https://api.textrequest.com/api/v3/Messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify({ AccountId: accountId, Contact: { PhoneNumber: phone }, Body: body }),
  });
}

export async function POST(req: NextRequest) {
  const { load_id, zone, cert_type, pu_state, dl_state } = await req.json();
  if (!load_id) return NextResponse.json({ error: "load_id required" }, { status: 400 });

  // Load context for SMS body
  const { data: load } = await supabase
    .from("loads")
    .select("*")
    .eq("id", load_id)
    .single();

  // Fetch Pro escorts matching zone/cert (accept either zone or pu_state)
  const stateFilter = zone || pu_state || null;

  let query = supabase
    .from("profiles")
    .select("id, push_token, full_name, phone")
    .eq("tier", "pro").or("role.eq.admin")
    .eq("role", "escort")
    .not("push_token", "is", null);

  if (stateFilter) query = query.eq("state", stateFilter);
  if (cert_type) query = query.contains("cert_types", [cert_type]);

  const { data: proEscorts } = await query;
  // Also include admin-email escorts
  const { data: adminEscorts } = await supabase
    .from("profiles")
    .select("id, email, push_token, phone")
    .eq("role", "escort")
    .in("email", ['brian@precisionpilotservices.com', 'bahamed3170@gmail.com']);
  const allEscorts = [...(proEscorts || []), ...(adminEscorts || [])].filter(
    (v, i, a) => a.findIndex((x: any) => x.id === v.id) === i
  );
  if (!allEscorts?.length) return NextResponse.json({ notified: 0, tier: "pro" });

  // Send push to all matching Pro escorts
  const inserts = allEscorts
    .filter((e: any) => e.push_token)
    .map((e: any) => ({
      token: e.push_token,
      title: "⭐ Pro Early Access — New Load",
      body: "A new load just posted. You have a 5-minute exclusive window before Members see it. Tap to view.",
      data: { load_id, type: "pro_early_access" },
    }));

  if (inserts.length) await supabase.from("push_queue").insert(inserts);

  // Send TextRequest SMS to each escort with a phone
  let smsSent = 0;
  if (load) {
    const puCity = load.pu_city || "";
    const dlCity = load.dl_city || "";
    const puSt = pu_state || load.pu_state || "";
    const dlSt = dl_state || load.dl_state || "";
    const rate = load.per_mile_rate ?? load.rate ?? "?";
    const msg = `New OEH Pro Load: ${puCity}, ${puSt} → ${dlCity}, ${dlSt}. Rate: $${rate}/mi. View: oversize-escort-hub.com/loads/${load_id}`;
    for (const e of allEscorts as any[]) {
      if (!e.phone) continue;
      try {
        await sendSMS(e.phone, msg);
        smsSent++;
      } catch {}
    }
  }

  // Schedule load to become visible to all after 5 minutes
  // This is handled by the loads table `visible_at` column (set on post)
  // The loads board filters: WHERE status='open' AND (visible_at IS NULL OR visible_at <= now())

  return NextResponse.json({ ok: true, notified: allEscorts.length, sms: smsSent, tier: "pro" });
}
