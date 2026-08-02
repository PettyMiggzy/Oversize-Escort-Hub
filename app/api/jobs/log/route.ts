import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const TRIAL_MAX_JOBS = 5;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // The jobs page sends { load_description, miles, earned, state }.
    const { load_description, miles, earned, state } = await req.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    if ((profile as any)?.tier === "trial") {
      const { count } = await supabase
        .from("job_logs")
        .select("id", { count: "exact" })
        .eq("escort_id", user.id);

      if ((count ?? 0) >= TRIAL_MAX_JOBS) {
        return NextResponse.json(
          { error: "Trial users limited to 5 job logs. Upgrade to Member+" },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabase.from("job_logs").insert({
      escort_id: user.id,
      load_description,
      miles,
      earned,
      state,
      logged_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, jobId: data?.id });
  } catch (error) {
    console.error("Job logging error:", error);
    return NextResponse.json({ error: "Job logging failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: jobs } = await supabase
      .from("job_logs")
      .select("*")
      .eq("escort_id", user.id)
      .order("logged_at", { ascending: false });

    const totalMiles = jobs?.reduce((sum, job) => sum + (job.miles || 0), 0) || 0;
    const totalEarned = jobs?.reduce((sum, job) => sum + (job.earned || 0), 0) || 0;

    return NextResponse.json({
      jobs,
      stats: {
        totalJobs: jobs?.length || 0,
        totalMiles,
        totalEarned,
        avgPerJob: jobs?.length ? (totalMiles / jobs.length).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("Job fetch error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
