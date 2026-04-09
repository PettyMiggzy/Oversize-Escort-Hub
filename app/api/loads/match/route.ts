import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export const dynamic = 'force-dynamic'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { load_id, action, carrier_id } = await req.json();
  // action: "accept" | "decline"
  if (!load_id || !action || !carrier_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: load } = await supabase
    .from("loads")
    .select("id, status, matched_escort_id, carrier_id, title")
    .eq("id", load_id)
    .single();

  if (!load) return NextResponse.json({ error: "Load not found" }, { status: 404 });
  if (load.carrier_id !== carrier_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (load.status !== "pending_match") {
    return NextResponse.json({ error: "Load is not pending" }, { status: 409 });
  }

  if (action === "accept") {
    // Get both contact infos
    const [{ data: carrierP }, { data: escortP }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, email").eq("id", carrier_id).single(),
      supabase.from("profiles").select("full_name, phone, email").eq("id", load.matched_escort_id).single(),
    ]);

    // Close load permanently
    await supabase.from("loads").update({ status: "filled" }).eq("id", load_id);

    // Notify escort
    const { data: escortProfile } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", load.matched_escort_id)
      .single();

    if (escortProfile?.push_token) {
      await supabase.from("push_queue").insert({
        token: escortProfile.push_token,
        title: "Match Accepted!",
        body: `${carrierP?.full_name ?? "Carrier"}: ${carrierP?.phone ?? carrierP?.email ?? "—"}`,
        data: { load_id, type: "match_accepted", carrier_contact: carrierP },
      });
    }

    return NextResponse.json({ ok: true, action: "accepted", escort_contact: escortP, carrier_contact: carrierP });
  }

  if (action === "decline") {
    // Reopen load
    await supabase.from("loads").update({
      status: "open",
      matched_escort_id: null,
      match_requested_at: null,
    }).eq("id", load_id);

    // Notify escort of decline
    const { data: escortProfile } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", load.matched_escort_id)
      .single();

    if (escortProfile?.push_token) {
      await supabase.from("push_queue").insert({
        token: escortProfile.push_token,
        title: "Match Declined",
        body: "The carrier has passed on your request. Keep looking — the load is back on the board.",
        data: { load_id, type: "match_declined" },
      });
    }

    return NextResponse.json({ ok: true, action: "declined" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
