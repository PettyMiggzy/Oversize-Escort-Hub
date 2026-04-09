import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export const dynamic = 'force-dynamic'
const supabase = createClient(
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
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error: upErr } = await svc.storage.from("verification-docs").upload(path, Buffer.from(bytes), {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: { publicUrl } } = svc.storage.from("verification-docs").getPublicUrl(path);

  // Mark pending in profiles
  await supabase.from("profiles").update({ dd214_pending: true, dd214_url: publicUrl } as any).eq("id", userId);

  // Email to verify@oversize-escort-hub.com via Resend (lazy-init to avoid build-time error)
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "OEH System <noreply@oversize-escort-hub.com>",
      to: ["verify@oversize-escort-hub.com"],
      subject: `DD-214 Submission — User ${userId}`,
      html: `
        <h2>New DD-214 Submission</h2>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Email:</strong> ${email ?? "unknown"}</p>
        <p><strong>Document:</strong> <a href="${publicUrl}">${file.name}</a></p>
        <p>Review and approve in the admin panel.</p>
      `,
    });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}
