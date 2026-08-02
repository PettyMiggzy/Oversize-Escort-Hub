import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = ["bahmed3170@gmail.com", "brian@precisionpilotservices.com"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const expiryDate = formData.get("expiryDate") as string;
    const certType = formData.get("certType") as string;

    if (!pdfFile || !expiryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const filename = `cert_${user.id}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(`certs/${filename}`, pdfFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(`certs/${filename}`);

    // Insert into `certifications` — the table every consumer reads (admin
    // approval queue, escort profile, find-escorts). status 'pending' + a
    // non-'bgc' type match the admin queue filter.
    const { data, error } = await supabase.from("certifications").insert({
      user_id: user.id,
      type: certType,
      status: "pending",
      document_url: urlData.publicUrl,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, certId: data?.id });
  } catch (error) {
    console.error("Cert upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email!)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { certId, approved } = await req.json();

    if (approved) {
      await supabase
        .from("certifications")
        .update({ status: "approved" })
        .eq("id", certId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Cert approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
