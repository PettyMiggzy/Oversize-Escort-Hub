import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const VERIFICATION_EMAIL = "verification@oversize-escort-hub.com";

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

    const filename = `bgc_${user.id}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(`bgc/${filename}`, pdfFile);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase.from("bgc_submissions").insert({
      user_id: user.id,
      pdf_path: `bgc/${filename}`,
      status: "pending_approval",
      submitted_at: new Date().toISOString(),
    });

    if (error) throw error;

    await sendEmail({
      to: VERIFICATION_EMAIL,
      subject: `New BGC Badge Submission - ${user.email}`,
      html: `<p>New BGC badge submission from ${user.email}</p><p>Review in admin panel</p>`,
    });

    return NextResponse.json({ success: true, // eslint-disable-next-line @typescript-eslint/no-explicit-any
        submissionId: (data as any)?.[0]?.id });
  } catch (error) {
    console.error("BGC submission error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
