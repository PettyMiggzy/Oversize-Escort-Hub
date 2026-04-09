import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userId = formData.get("user_id") as string;
  const email = formData.get("email") as string;

  if (!file || !userId) {
    return NextResponse.json({ error: "Missing file or user_id" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const bytes = await file.arrayBuffer();
  const path = `dd214/${userId}_${Date.now()}_${file.name}`;

  const { error: upErr } = await svc.storage.from("verification-docs").upload(path, Buffer.from(bytes), {
    contentType: file.type, upsert: false,
  });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: { publicUrl } } = svc.storage.from("verification-docs").getPublicUrl(path);

  // Mark pending in profiles
  await svc.from("profiles").update({ dd214_pending: true, dd214_url: publicUrl } as any).eq("id", userId);

  // Email to verify@oversize-escort-hub.com via Resend
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "OEH System <noreply@oversize-escort-hub.com>",
      to: ["verify@oversize-escort-hub.com"],
      subject: `DD-214 Submission — User ${userId}`,
      html: `
        <div style="font-family:sans-serif;background:#f4f4f4;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
            <div style="background:#0a0a0a;padding:20px;text-align:center;margin-bottom:20px;">
              <img src="https://www.oversize-escort-hub.com/logo.png" alt="Oversize Escort Hub" style="height:60px;width:auto;" />
            </div>
            <div style="padding:24px;">
              <h2 style="color:#ff6600;">New DD-214 Submission</h2>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Email:</strong> ${email ?? "unknown"}</p>
              <p><strong>Document:</strong> <a href="${publicUrl}">${file.name}</a></p>
              <p>Review and approve in the admin panel.</p>
            </div>
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}
