import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { signedDocUrl } from "@/lib/signed-url";
import { VERIFICATION_LIVE } from "@/lib/verification";
import { DOC_EXT, DOC_LIMITS, DOC_MIME, canUseDocs, sniffDocType } from "@/lib/profile-docs";

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
    const pdfFile = (formData.get("pdf") || formData.get("file")) as File | null;
    const expiryDate = formData.get("expiryDate") as string | null;
    // a short plain label ("pevo", "insurance", "state_cert"); anything else is cleaned, never trusted as markup
    const certType = String(formData.get("certType") || "pevo").toLowerCase().replace(/[^a-z0-9_/ -]/g, "").slice(0, 30) || "pevo";

    // uploading documents is part of a paid plan (open to everyone while plans are free)
    const { data: me } = await serviceClient().from("profiles").select("tier, role").eq("id", user.id).maybeSingle();
    if (!canUseDocs(me?.tier, me?.role)) {
      return NextResponse.json({ error: "Uploading documents is part of a paid plan.", upgrade: true }, { status: 402 });
    }

    if (!pdfFile || !expiryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      return NextResponse.json({ error: "Pick the expiry date from the calendar" }, { status: 400 });
    }
    if (pdfFile.size > DOC_LIMITS.maxBytes) {
      return NextResponse.json({ error: "File exceeds 10 MB" }, { status: 400 });
    }
    // a PDF or a photo, decided by the file's own first bytes
    const bytes = new Uint8Array(await pdfFile.arrayBuffer());
    const kind = sniffDocType(bytes);
    if (!kind) {
      return NextResponse.json({ error: "Upload a PDF or a photo (JPG, PNG or WebP)" }, { status: 400 });
    }

    // spam guard: a handful waiting for review, and a sensible total
    const { data: mineAll } = await serviceClient().from("certifications").select("id, status").eq("user_id", user.id).limit(100);
    const rowsMine = (mineAll ?? []) as { status: string | null }[];
    if (rowsMine.filter((r) => r.status === "pending").length >= DOC_LIMITS.maxPending) {
      return NextResponse.json({ error: "You already have several documents waiting for review. We will get to them first." }, { status: 429 });
    }
    if (rowsMine.length >= DOC_LIMITS.maxTotal) {
      return NextResponse.json({ error: "You have reached the document limit. Email support to remove old ones." }, { status: 429 });
    }

    // P/EVO cert review uploads require the pevo paywall purchase first
    const normalizedType = certType === "p_evo" ? "pevo" : certType;
    const lowered = normalizedType.toLowerCase();
    if (VERIFICATION_LIVE && (lowered.includes("pevo") || lowered.includes("p/evo"))) {
      const { data: prof } = await serviceClient()
        .from("profiles")
        .select("pevo_paid")
        .eq("id", user.id)
        .maybeSingle();
      if (!prof?.pevo_paid) {
        return NextResponse.json({ error: "Purchase P/EVO cert review before uploading" }, { status: 402 });
      }
    }

    const filename = `cert_${user.id}_${Date.now()}.${DOC_EXT[kind]}`;
    const path = `certs/${filename}`;
    // uploaded with the service key into a private bucket: the file never needs a public address
    const { error: uploadError } = await serviceClient().storage
      .from("documents")
      .upload(path, bytes, { contentType: DOC_MIME[kind], upsert: false });

    if (uploadError) throw uploadError;

    const document_url = await signedDocUrl(serviceClient(), "documents", path);

    // Admin queues + /api/bgc/approve read certifications (status pending), not escort_certs.
    const type = normalizedType;
    const isPevoType = VERIFICATION_LIVE && (lowered.includes("pevo") || lowered.includes("p/evo"));
    const { data, error } = await serviceClient()
      .from("certifications")
      .insert({
        user_id: user.id,
        type,
        // only a P/EVO certificate goes into our paid review; insurance, vehicle and other papers are simply uploaded by the escort,
        // and we do not check them
        status: isPevoType ? "pending" : "uploaded",
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
    if (VERIFICATION_LIVE && isPevo && cert?.user_id) {
      const { error: pevoErr } = await svc.from("profiles").update({ pevo_verified: true }).eq("id", cert.user_id);
      if (pevoErr) throw pevoErr;
    }
    const isVehicle = ct === "vehicle" || ct.includes("vehicle");
    if (VERIFICATION_LIVE && isVehicle && cert?.user_id) {
      const { error: vehErr } = await svc.from("profiles").update({ vehicle_verified: true }).eq("id", cert.user_id);
      if (vehErr) throw vehErr;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cert approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
