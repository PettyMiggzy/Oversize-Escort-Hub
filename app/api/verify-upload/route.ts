import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { escapeHtml } from '@/lib/security'

export async function POST(req: Request) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  try {
    const { tier, fileName } = await req.json()
    // the page sends tier as the number 1 or 2; anything else is refused
    const t = Number(tier)
    if (t !== 1 && t !== 2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const userId = user!.id
    const subject = t === 1 ? 'Tier 1 P/EVO Cert Submission' : 'Tier 2 Vehicle Submission'
    const certType = t === 1 ? 'pevo' : 'vehicle'
    const bucket = t === 1 ? 'pevo-certs' : 'vehicle-docs'

    // Create a pending row so admin Certs/Verification queues can approve in-app
    // (email alone left submissions invisible to the admin UI).
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await svc.from('certifications').insert({
      user_id: userId,
      type: certType,
      status: 'pending',
      document_url: `${bucket}/${userId}/${String(fileName || 'upload').slice(0, 200)}`,
      created_at: new Date().toISOString(),
    })

    await sendEmail({
      to: 'verify@oversize-escort-hub.com',
      subject,
      html: `<p><strong>Tier ${t} Verification Submission</strong></p><p>User ID: ${escapeHtml(userId)}</p><p>File: ${escapeHtml(String(fileName || 'N/A').slice(0, 200))}</p><p>Bucket: ${bucket}/${escapeHtml(userId)}/</p><p>Submitted: ${new Date().toISOString()}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[verify-upload] error:', err)
    return NextResponse.json({ error: 'Could not send the notice' }, { status: 500 })
  }
}
