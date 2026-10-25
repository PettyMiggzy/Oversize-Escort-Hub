import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { FREE_LAUNCH } from '@/lib/free-launch';
import { requireAdmin } from "@/lib/api-auth";
import { signedDocUrl } from "@/lib/signed-url";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const expiryDate = formData.get("expiryDate") as string | null;
    const certType = (formData.get("certType") as string | null) || "pevo";

    if (!pdfFile || !expiryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json({ error: "Upload a PDF" }, { status: 400 });
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10 MB" }, { status: 400 });
    }

    // P/EVO cert review uploads require the pevo paywall purchase first
    const normalizedType = certType === "p_evo" ? "pevo" : certType;
    const lowered = normalizedType.toLowerCase();
    if (!FREE_LAUNCH && (lowered.includes("pevo") || lowered.includes("p/evo"))) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("pevo_paid")
        .eq("id", user.id)
        .maybeSingle();
      if (!prof?.pevo_paid) {
        return NextResponse.json({ error: "Purchase P/EVO cert review before uploading" }, { status: 402 });
      }
    }

    const filename = `cert_${user.id}_${Date.now()}.pdf`;
    const path = `certs/${filename}`;
    // uploaded with the service key into a private bucket: the file never needs a public address
    const { error: uploadError } = await serviceClient().storage
      .from("documents")
      .upload(path, pdfFile, { contentType: "application/pdf", upsert: false });

    if (uploadError) throw uploadError;

    const document_url = await signedDocUrl(serviceClient(), "documents", path);

    // Admin queues + /api/bgc/approve read certifications (status pending), not escort_certs.
    const type = normalizedType;
    const { data, error } = await serviceClient()
      .from("certifications")
      .insert({
        user_id: user.id,
        type,
        status: "pending",
        document_url,
        expiry_date: expiryDate,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, certId: data?.id });
  } catch (error) {
    console.error("Cert upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error: authErr } = await requireAdmin();
    if (authErr) return authErr;

    const { certId, approved } = await req.json();
    if (!certId || !approved) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const svc = serviceClient();
    const { data: cert } = await svc
      .from("certifications")
      .select("id, user_id, type")
      .eq("id", certId)
      .single();

    const { error } = await svc
      .from("certifications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id,
      })
      .eq("id", certId);
    if (error) throw error;

    const ct = (cert?.type || "").toString().toLowerCase();
    const isPevo = ct === "pevo" || ct.includes("pevo") || ct.includes("p/evo");
    if (isPevo && cert?.user_id) {
      const { error: pevoErr } = await svc.from("profiles").update({ pevo_verified: true }).eq("id", cert.user_id);
      if (pevoErr) throw pevoErr;
    }
    const isVehicle = ct === "vehicle" || ct.includes("vehicle");
    if (isVehicle && cert?.user_id) {
      const { error: vehErr } = await svc.from("profiles").update({ vehicle_verified: true }).eq("id", cert.user_id);
      if (vehErr) throw vehErr;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cert approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
