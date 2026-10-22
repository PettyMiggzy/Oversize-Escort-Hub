import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { escapeHtml } from '@/lib/security'

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
    if (certType === 'pevo') {
      const { data: prof } = await svc
        .from('profiles')
        .select('pevo_paid')
        .eq('id', userId)
        .maybeSingle()
      if (!prof?.pevo_paid) {
        return NextResponse.json({ error: 'Purchase P/EVO cert review before uploading' }, { status: 402 })
      }
    }

    // Prefer the public URL / path the client just uploaded (includes timestamp).
    // Fall back only when older clients omit them.
    const path =
      typeof storagePath === 'string' && storagePath.startsWith(`${userId}/`)
        ? storagePath.slice(0, 400)
        : `${userId}/${String(fileName || 'upload').slice(0, 200)}`

    let docUrl =
      typeof documentUrl === 'string' && documentUrl.startsWith('http')
        ? documentUrl.slice(0, 1000)
        : ''
    if (!docUrl) {
      const { data: urlData } = svc.storage.from(bucket).getPublicUrl(path)
      docUrl = urlData.publicUrl
    }

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
