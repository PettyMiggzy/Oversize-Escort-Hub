import { VERIFICATION_LIVE, NOT_AVAILABLE } from '@/lib/verification'
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { escapeHtml, DOC_TYPES } from "@/lib/security";
import { isAdminEmail } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!VERIFICATION_LIVE) return NextResponse.json({ error: NOT_AVAILABLE }, { status: 410 })
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return NextResponse.json({ error: "PDF required" }, { status: 400 });
    }
    if (pdfFile.size > 10 * 1024 * 1024 || !DOC_TYPES.includes(pdfFile.type)) {
      return NextResponse.json({ error: "Upload a PDF or an image under 10 MB" }, { status: 400 });
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
    }).select("id").single();

    if (error) throw error;

    await sendEmail({
      to: "verification@oversize-escort-hub.com",
      subject: `DD-214 Veteran Discount - ${user.email}`,
      html: `<p>New DD-214 submission for veteran discount from ${escapeHtml(user.email)}</p>`,
    });

    return NextResponse.json({ success: true, submissionId: (data as any)?.id });
  } catch (error) {
    console.error("DD-214 submission error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!VERIFICATION_LIVE) return NextResponse.json({ error: NOT_AVAILABLE }, { status: 410 })
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { submissionId, approved } = await req.json();
    if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

    const { data: sub } = await supabase.from("dd214_submissions").select("user_id, status").eq("id", submissionId).single();
    if (!sub?.user_id) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    if (sub.status !== "pending") return NextResponse.json({ error: "Already decided" }, { status: 409 });

    if (approved === false) {
      await supabase.from("dd214_submissions").update({ status: "rejected" }).eq("id", submissionId).eq("status", "pending");
      return NextResponse.json({ success: true });
    }

    if (approved) {
      const { data: done } = await supabase.from("dd214_submissions").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", submissionId).eq("status", "pending").select("id");
      if (!done?.length) return NextResponse.json({ error: "Already decided" }, { status: 409 });

      await supabase.from("veteran_discounts").insert({
        user_id: sub.user_id,
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
