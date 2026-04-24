import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic'

const supabase = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { load_id } = await req.json();

  // Server-side auth: derive escort_id from session, not body
  const authed = await createServerSupabase();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const escort_id = user.id;

  if (!load_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check load is open
  const { data: load, error: le } = await supabase
    .from("loads")
    .select("id, status, carrier_id, title")
    .eq("id", load_id)
    .single();
  if (le || !load) return NextResponse.json({ error: "Load not found" }, { status: 404 });
  if (load.status !== "open") {
    return NextResponse.json({ error: "Load is not available" }, { status: 409 });
  }

  // Mark pending_match with 1-hour expiry handled by cron
  const { error: ue } = await supabase
    .from("loads")
    .update({
      status: "pending_match",
      matched_escort_id: escort_id,
      match_requested_at: new Date().toISOString(),
    })
    .eq("id", load_id)
    .eq("status", "open");

  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 });

  // Notify carrier via push
  const { data: carrierProfile } = await supabase
    .from("profiles")
    .select("push_token")
    .eq("id", load.carrier_id)
    .single();

  if (carrierProfile?.push_token) {
    await supabase.from("push_queue").insert({
      token: carrierProfile.push_token,
      title: "New Match Request",
      body: `An escort has requested your load. Tap to accept or decline.`,
      data: { load_id, escort_id, type: "match_request" },
    });
  }

  return NextResponse.json({ ok: true });
}
