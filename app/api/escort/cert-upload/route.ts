import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = ["bahmed3170@gmail.com", "brian@precisionpilotservices.com"];

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
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

    const { data, error } = await supabase.from("escort_certs").insert({
      user_id: user.id,
      cert_type: certType,
      pdf_path: `certs/${filename}`,
      expiry_date: expiryDate,
      status: "pending_approval",
      uploaded_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, certId: (data as any)?.[0]?.id });
  } catch (error) {
    console.error("Cert upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email!)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { certId, approved } = await req.json();

    if (approved) {
      await supabase
        .from("escort_certs")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", certId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Cert approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
