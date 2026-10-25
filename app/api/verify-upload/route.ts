import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { FREE_LAUNCH } from '@/lib/free-launch'
import { escapeHtml } from '@/lib/security'
import { signedDocUrl } from '@/lib/signed-url'

export async function POST(req: Request) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  try {
    const body = await req.json()
    const { tier, fileName, storagePath, documentUrl } = body
    // the page sends tier as the number 1 or 2; anything else is refused
    const t = Number(tier)
    if (t !== 1 && t !== 2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const userId = user!.id
    const subject = t === 1 ? 'Tier 1 P/EVO Cert Submission' : 'Tier 2 Vehicle Submission'
    const certType = t === 1 ? 'pevo' : 'vehicle'
    const bucket = t === 1 ? 'pevo-certs' : 'vehicle-docs'

    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Same paywall as /api/escort/cert-upload for P/EVO cert review
    if (certType === 'pevo' && !FREE_LAUNCH) {
      const { data: prof } = await svc
        .from('profiles')
        .select('pevo_paid')
        .eq('id', userId)
        .maybeSingle()
      if (!prof?.pevo_paid) {
        return NextResponse.json({ error: 'Purchase P/EVO cert review before uploading' }, { status: 402 })
      }
    }

    // The file must be in this user's own folder; the link is made here from that path, never taken from the request
    const mine = typeof storagePath === 'string' && storagePath.startsWith(`${userId}/`) && !storagePath.includes('..')
    const claimedUrl = typeof documentUrl === 'string' && documentUrl ? documentUrl : null
    if (claimedUrl && !claimedUrl.includes(`/${bucket}/${userId}/`)) {
      return NextResponse.json({ error: 'That file does not belong to this account' }, { status: 400 })
    }
    if (!mine) {
      return NextResponse.json({ error: 'Upload the file first' }, { status: 400 })
    }
    const path = (storagePath as string).slice(0, 400)
    let docUrl: string
    try { docUrl = await signedDocUrl(svc, bucket, path) } catch { return NextResponse.json({ error: 'Could not find the uploaded file' }, { status: 400 }) }

    // Create a pending row so admin Certs/Verification queues can approve in-app
    // (email alone left submissions invisible to the admin UI).
    const { error: insertErr } = await svc.from('certifications').insert({
      user_id: userId,
      type: certType,
      status: 'pending',
      document_url: docUrl,
      created_at: new Date().toISOString(),
    })
    if (insertErr) {
      console.error('[verify-upload] certifications insert', insertErr)
      return NextResponse.json({ error: 'Could not create review row' }, { status: 500 })
    }

    await sendEmail({
      to: 'verify@oversize-escort-hub.com',
      subject,
      html: `<p><strong>Tier ${t} Verification Submission</strong></p><p>User ID: ${escapeHtml(userId)}</p><p>File: ${escapeHtml(String(fileName || 'N/A').slice(0, 200))}</p><p>Path: ${escapeHtml(bucket)}/${escapeHtml(path)}</p><p>Submitted: ${new Date().toISOString()}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[verify-upload] error:', err)
    return NextResponse.json({ error: 'Could not send the notice' }, { status: 500 })
  }
}
