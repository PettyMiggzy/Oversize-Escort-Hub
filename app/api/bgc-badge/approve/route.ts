import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { certificationId, action } = await req.json()
    if (!certificationId || !action) return NextResponse.json({ error: "certificationId and action required" }, { status: 400 })

    if (action === "approve") {
      // Update certifications.status
      const { data: cert, error: certErr } = await svc
        .from("certifications")
        .update({ status: "approved" })
        .eq("id", certificationId)
        .select("user_id")
        .single()
      if (certErr) return NextResponse.json({ error: certErr.message }, { status: 500 })

      // Set profiles.bgc_verified = true
      if (cert?.user_id) {
        await svc.from("profiles").update({ bgc_verified: true }).eq("id", cert.user_id)
      }

      return NextResponse.json({ success: true })
    } else if (action === "deny") {
      await svc.from("certifications").update({ status: "denied" }).eq("id", certificationId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("BGC approval error:", error)
    return NextResponse.json({ error: "Approval failed" }, { status: 500 })
  }
}
