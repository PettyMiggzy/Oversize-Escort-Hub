import { createBrowserClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null

    if (!file || !userId) return NextResponse.json({ error: "missing file or userId" }, { status: 400 })
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
