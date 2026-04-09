import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/referral?user_id=xxx — get or create referral link for user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  let { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (!profile?.referral_code) {
    // Generate a unique code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from("profiles").update({ referral_code: code }).eq("id", userId);
    profile = { referral_code: code };
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://oversize-escort-hub.com"}/join?ref=${profile.referral_code}`;
  
  // Get referral stats
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, created_at, converted_at")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ 
    code: profile.referral_code, 
    link,
    referrals: referrals ?? [],
    total: referrals?.length ?? 0,
    converted: referrals?.filter((r: any) => r.status !== "pending").length ?? 0,
  });
}

// POST /api/referral — track when a referred user signs up
export async function POST(req: NextRequest) {
  const { ref_code, new_user_id } = await req.json();
  if (!ref_code || !new_user_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Find referrer
  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", ref_code)
    .single();

  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });

  // Create referral record
  await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: new_user_id,
    status: "converted",
    converted_at: new Date().toISOString(),
  });

  // Mark referred_by on new user
  await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", new_user_id);

  return NextResponse.json({ ok: true });
}
