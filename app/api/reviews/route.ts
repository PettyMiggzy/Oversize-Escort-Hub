import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { load_id, reviewer_id, reviewee_id, rating, body } = await req.json();
  if (!load_id || !reviewer_id || !reviewee_id || !rating) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }
  const { error } = await supabase.from("reviews").insert({
    load_id, reviewer_id, reviewee_id, rating, body,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profile_id = searchParams.get("profile_id");
  if (!profile_id) return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, body, created_at, reviewer_id, profiles!reviewer_id(full_name, avatar_url)")
    .eq("reviewee_id", profile_id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}
