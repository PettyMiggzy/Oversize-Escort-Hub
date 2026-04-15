import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const TRIAL_MAX_JOBS = 5;

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { loadId, mileage, expenses, notes } = await req.json();

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
      load_id: loadId,
      mileage,
      expenses: expenses || [],
      notes,
      logged_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, jobId: (data as any)?.[0]?.id });
  } catch (error) {
    console.error("Job logging error:", error);
    return NextResponse.json({ error: "Job logging failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: jobs } = await supabase
      .from("job_logs")
      .select("*")
      .eq("escort_id", user.id)
      .order("logged_at", { ascending: false });

    const totalMiles = jobs?.reduce((sum, job) => sum + (job.mileage || 0), 0) || 0;
    const totalExpenses = jobs?.reduce((sum, job) => {
      const jobExpenses = job.expenses?.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0;
      return sum + jobExpenses;
    }, 0) || 0;

    return NextResponse.json({
      jobs,
      stats: {
        totalJobs: jobs?.length || 0,
        totalMiles,
        totalExpenses,
        avgPerJob: jobs?.length ? (totalMiles / jobs.length).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("Job fetch error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
