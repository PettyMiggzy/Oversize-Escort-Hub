import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { escortAccess, claimRefusal } from "@/lib/access-server";
import { sendWebPushToUser } from "@/lib/push";

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
    .select("id, status, carrier_id, created_at")
    .eq("id", load_id)
    .single();
  if (le || !load) return NextResponse.json({ error: "Load not found" }, { status: 404 });
  if (load.status !== "open") {
    return NextResponse.json({ error: "Load is not available" }, { status: 409 });
  }
  if (load.carrier_id === escort_id) {
    return NextResponse.json({ error: "You cannot claim your own load" }, { status: 403 });
  }
  // the plan rules (free locked out, Members after the Pro head start) are decided here, not only in the browser
  const refusal = claimRefusal(await escortAccess(authed, user), load.created_at);
  if (refusal) return NextResponse.json({ error: refusal }, { status: 403 });

  // Mark pending_match with 1-hour expiry handled by cron
  const { data: claimed, error: ue } = await supabase
    .from("loads")
    .update({
      status: "pending_match",
      matched_escort_id: escort_id,
      match_requested_at: new Date().toISOString(),
    })
    .eq("id", load_id)
    .eq("status", "open")
    .select("id");

  if (ue) return NextResponse.json({ error: "Could not claim the load" }, { status: 500 });
  // two escorts racing for one load: only the one whose update matched a row has it
  if (!claimed?.length) return NextResponse.json({ error: "Load is not available" }, { status: 409 });

  await sendWebPushToUser(load.carrier_id, {
    title: "New Match Request",
    body: "An escort has requested your load. Tap to accept or decline.",
    url: "/dashboard",
    data: { load_id, escort_id, type: "match_request" },
  });

  return NextResponse.json({ ok: true });
}
