import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/loads/expire — call this from Vercel Cron or Supabase Edge Functions
// vercel.json: {"crons":[{"path":"/api/loads/expire","schedule":"*/5 * * * *"}]}
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: expired } = await supabase
    .from("loads")
    .select("id, matched_escort_id")
    .eq("status", "pending_match")
    .lt("match_requested_at", oneHourAgo);

  if (!expired?.length) return NextResponse.json({ expired: 0 });

  // Reopen all expired loads
  const ids = expired.map((l: any) => l.id);
  await supabase.from("loads").update({
    status: "open",
    matched_escort_id: null,
    match_requested_at: null,
  }).in("id", ids);

  // Notify escorts their hold expired
  for (const load of expired) {
    if (!load.matched_escort_id) continue;
    const { data: ep } = await supabase.from("profiles").select("push_token").eq("id", load.matched_escort_id).single();
    if (ep?.push_token) {
      await supabase.from("push_queue").insert({
        token: ep.push_token,
        title: "Match Expired",
        body: "The carrier did not respond in time. The load is back on the board.",
        data: { load_id: load.id, type: "match_expired" },
      });
    }
  }

  return NextResponse.json({ expired: ids.length });
}
