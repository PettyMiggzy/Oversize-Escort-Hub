import { sendEmail } from '@/lib/email';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from '@/lib/api-auth';
import { DOC_TYPES, escapeHtml, safeFileName } from '@/lib/security';
import { signedDocUrl } from "@/lib/signed-url";

export const dynamic = 'force-dynamic'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: the signed-in user's own DD-214 / veteran discount status (what /dd214 shows)
export async function GET() {
  const { user, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const [{ data: profile }, { data: discount }, { data: pendingSub }] = await Promise.all([
    svc.from("profiles").select("dd214_pending").eq("id", user!.id).single(),
    svc.from("veteran_discounts").select("created_at").eq("user_id", user!.id).limit(1),
    svc.from("dd214_submissions").select("id, status").eq("user_id", user!.id).eq("status", "pending").limit(1),
  ]);

  if (discount?.length) return NextResponse.json({ status: "approved", discount_active: true });
  if (pendingSub?.length || (profile as any)?.dd214_pending) {
    return NextResponse.json({ status: "pending" });
  }
  const { data: rejected } = await svc
    .from("dd214_submissions")
    .select("id")
    .eq("user_id", user!.id)
    .eq("status", "rejected")
    .order("submitted_at", { ascending: false })
    .limit(1);
  if (rejected?.length) return NextResponse.json({ status: "rejected" });
  return NextResponse.json({ status: "none" });
}

export async function POST(req: NextRequest) {
  const { user, error: authErr } = await requireAuth();
  if (authErr) return authErr;
  const userId = user!.id;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 10 MB" }, { status: 400 });
  }
  if (!DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Upload a PDF or an image" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const path = `dd214/${userId}/${Date.now()}_${safeFileName(file.name)}`;

  const { error: upErr } = await svc.storage.from("verification-docs").upload(path, Buffer.from(bytes), {
    contentType: file.type, upsert: false,
  });

  if (upErr) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

  let publicUrl: string;
  try { publicUrl = await signedDocUrl(svc, "verification-docs", path); } catch { return NextResponse.json({ error: "Upload failed" }, { status: 500 }); }

  const { error: profErr } = await svc.from("profiles").update({ dd214_pending: true, dd214_url: publicUrl } as any).eq("id", userId);
  if (profErr) {
    console.error('[dd214] profile update', profErr);
    return NextResponse.json({ error: "Could not mark pending" }, { status: 500 });
  }

  const { error: subErr } = await svc.from("dd214_submissions").insert({
    user_id: userId,
    pdf_path: path,
    document_url: publicUrl,
    status: "pending",
    submitted_at: new Date().toISOString(),
  });
  if (subErr) {
    console.error('[dd214] submission insert', subErr);
    return NextResponse.json({ error: "Could not create submission" }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    await sendEmail({
      to: "verify@oversize-escort-hub.com",
      subject: `DD-214 Submission — User ${userId}`,
      html: `
        <div style="font-family:sans-serif;background:#f4f4f4;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
            <div style="background:#0a0a0a;padding:20px;text-align:center;margin-bottom:20px;">
              <img src="https://www.oversize-escort-hub.com/logo.png" alt="Oversize Escort Hub" style="height:60px;width:auto;" />
            </div>
            <div style="padding:24px;">
              <h2 style="color:#ff6600;">New DD-214 Submission</h2>
              <p><strong>User ID:</strong> ${escapeHtml(userId)}</p>
              <p><strong>Email:</strong> ${escapeHtml(user!.email ?? "unknown")}</p>
              <p><strong>Document:</strong> <a href="${escapeHtml(publicUrl)}">${escapeHtml(file.name)}</a></p>
              <p>Review and approve in the admin panel.</p>
            </div>
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
