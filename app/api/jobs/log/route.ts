import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { effectiveTier } from '@/lib/free-launch'
import { isAdminEmail } from "@/lib/supabase";

const TRIAL_MAX_JOBS = 5;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const loadId = typeof body.loadId === "string" ? body.loadId : null;
    const mileage = Number.isFinite(Number(body.mileage)) && Number(body.mileage) >= 0 ? Number(body.mileage) : 0;
    const expenses = Array.isArray(body.expenses) ? body.expenses.slice(0, 100) : [];
    const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier, role")
      .eq("id", user.id)
      .single();

    // the trial cap covers everyone without a paid plan (a profile's tier can also read 'free')
    const tier = effectiveTier((profile as any)?.tier, (profile as any)?.role);
    if ((!tier || tier === "trial" || tier === "free") && !isAdminEmail(user.email)) {
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
      expenses,
      notes,
      logged_at: new Date().toISOString(),
    }).select("id").single();

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

    const totalMiles = jobs?.reduce((sum, job) => sum + (job.mileage || 0), 0) || 0;
    const totalExpenses = jobs?.reduce((sum, job) => {
      const jobExpenses = Array.isArray(job.expenses) && job.expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0;
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
