import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return NextResponse.json({ error: "PDF required" }, { status: 400 });
    }

    const filename = `dd214_${user.id}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(`dd214/${filename}`, pdfFile);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase.from("dd214_submissions").insert({
      user_id: user.id,
      pdf_path: `dd214/${filename}`,
      status: "pending",
      submitted_at: new Date().toISOString(),
    });

    if (error) throw error;

    await sendEmail({
      to: "verification@oversize-escort-hub.com",
      subject: `DD-214 Veteran Discount - ${user.email}`,
      html: `<p>New DD-214 submission for veteran discount from ${user.email}</p>`,
    });

    return NextResponse.json({ success: true, submissionId: (data as any)?.[0]?.id });
  } catch (error) {
    console.error("DD-214 submission error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !["bahmed3170@gmail.com", "brian@precisionpilotservices.com"].includes(user.email!)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { submissionId, approved } = await req.json();

    if (approved) {
      await supabase.from("dd214_submissions").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", submissionId);

      const { data: sub } = await supabase.from("dd214_submissions").select("user_id").eq("id", submissionId).single();
      
      await supabase.from("veteran_discounts").insert({
        user_id: (sub as any)?.user_id,
        discount_percentage: 30,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("DD-214 approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
