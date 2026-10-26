import { NextRequest, NextResponse } from 'next/server'
import { VERIFICATION_LIVE, NOT_AVAILABLE } from '@/lib/verification'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSvcClient } from '@supabase/supabase-js'
import { serviceClient } from '@/lib/service-client'
import { Resend } from 'resend'
import { signedDocUrl } from '@/lib/signed-url'
import { DOC_TYPES } from '@/lib/security'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ status: 'none' })

  const { data: prof } = await serviceClient()
    .from('profiles')
    .select('bgc_verified, bgc_pending')
    .eq('id', user.id)
    .single()

  if (prof?.bgc_verified) {
    return NextResponse.json({ status: 'approved' })
  }

  const { data: cert } = await supabase
    .from('certifications')
    .select('status, created_at, reviewed_at')
    .eq('user_id', user.id)
    .eq('type', 'bgc')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cert?.status === 'approved') {
    return NextResponse.json({ status: 'approved', approved_at: cert.reviewed_at ?? undefined })
  }
  if (cert?.status === 'rejected') {
    return NextResponse.json({ status: 'rejected', submitted_at: cert.created_at })
  }
  if (cert?.status === 'pending' || prof?.bgc_pending) {
    return NextResponse.json({ status: 'pending', submitted_at: cert?.created_at })
  }
  return NextResponse.json({ status: 'none' })
}

export async function POST(req: NextRequest) {
  if (!VERIFICATION_LIVE) return NextResponse.json({ error: NOT_AVAILABLE }, { status: 410 })
  // Auth via session
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Payment gate
  const { data: prof } = await serviceClient().from('profiles').select('bgc_paid, bgc_verified, full_name, email').eq('id', user.id).single()
  if (prof?.bgc_verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 })
  if (!prof?.bgc_paid) return NextResponse.json({ error: 'Payment required before upload' }, { status: 402 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 400 })
  if (!DOC_TYPES.includes(file.type)) return NextResponse.json({ error: 'Upload a PDF or an image' }, { status: 400 })

  // Service-role for storage + cross-row writes
  const svc = createSvcClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `bgc/${user.id}/${Date.now()}_${safeName}`
  const bytes = await file.arrayBuffer()
  const buf = Buffer.from(bytes)
  const { error: upErr } = await svc.storage.from('bgc-submissions').upload(path, buf, { contentType: file.type, upsert: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  let publicUrl: string
  try { publicUrl = await signedDocUrl(svc, 'bgc-submissions', path) } catch { return NextResponse.json({ error: 'Upload failed' }, { status: 500 }) }

  const { error: profErr } = await svc
    .from('profiles')
    .update({ bgc_pending: true })  // the document link lives only on the review row, never on the profile other users can read
    .eq('id', user.id)
  if (profErr) {
    console.error('[bgc] profile update', profErr)
    return NextResponse.json({ error: 'Could not mark pending' }, { status: 500 })
  }

  const { error: certErr } = await svc.from('certifications').insert({
    user_id: user.id,
    type: 'bgc',
    status: 'pending',
    document_url: publicUrl,
    created_at: new Date().toISOString(),
  })
  if (certErr) {
    console.error('[bgc] certifications insert', certErr)
    return NextResponse.json({ error: 'Could not create review row' }, { status: 500 })
  }

  // Notify verify@ for manual review
  try {
    await resend.emails.send({
      from: 'OEH Verify <noreply@oversize-escort-hub.com>',
      to: 'verify@oversize-escort-hub.com',
      subject: `[OEH BGC] New submission — ${prof?.full_name || user.email}`,
      html: `
        <h2>New BGC submission</h2>
        <p><strong>User:</strong> ${prof?.full_name || '—'} (${user.email})</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Document:</strong> <a href="${publicUrl}">${publicUrl}</a></p>
        <p>Approve or deny in the admin panel: <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">${process.env.NEXT_PUBLIC_APP_URL}/admin</a></p>
      `,
      attachments: [{ filename: safeName, content: buf.toString('base64') }],
    })
  } catch (e: any) {
    console.error('[bgc] resend failed:', e?.message)
    // Don't fail the upload if email fails — admin can still see it in panel.
  }

  return NextResponse.json({ ok: true, url: publicUrl })
}
