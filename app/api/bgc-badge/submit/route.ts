import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Derive the user from the session, not the request body.
    const authed = await createServerClient()
    const { data: { user } } = await authed.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = user.id

    // Payment gate — mirror /api/bgc: the BGC badge is a paid product.
    const { data: prof } = await authed.from("profiles").select("bgc_paid, bgc_verified").eq("id", userId).single()
    if (prof?.bgc_verified) return NextResponse.json({ error: "Already verified" }, { status: 400 })
    if (!prof?.bgc_paid) return NextResponse.json({ error: "Payment required before upload" }, { status: 402 })

    const formData = await req.formData()
    // The client sends the field as "pdf"; accept "file" too for robustness.
    const file = (formData.get("pdf") ?? formData.get("file")) as File | null

    if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 10 MB" }, { status: 400 })

    // Upload to permits bucket
    const filename = `bgc/${Date.now()}_${file.name}`
    const bytes = await file.arrayBuffer()
    const { error: upErr } = await svc.storage
      .from("permits")
      .upload(filename, Buffer.from(bytes), { contentType: file.type, upsert: true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: { publicUrl } } = svc.storage.from("permits").getPublicUrl(filename)

    // Insert into certifications table
    const { data, error: certErr } = await svc.from("certifications").insert({
      user_id: userId,
      type: "bgc",
      status: "pending",
      file_url: publicUrl,
    }).select().single()
    if (certErr) return NextResponse.json({ error: certErr.message }, { status: 500 })

    // Send Resend email notification
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "OEH Admin <noreply@oversize-escort-hub.com>",
          to: ["verify@oversize-escort-hub.com"],
          subject: "New BGC Submission",
          html: `<p>New BGC submission from user ${userId}.</p><p><a href="${publicUrl}">View Document</a></p>`,
        }),
      })
    }

    return NextResponse.json({ success: true, submissionId: data?.id })
  } catch (error) {
    console.error("BGC submission error:", error)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}
