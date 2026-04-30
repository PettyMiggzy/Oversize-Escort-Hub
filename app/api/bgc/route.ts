import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSvcClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  // Auth via session
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Payment gate
  const { data: prof } = await supabase.from('profiles').select('bgc_paid, bgc_verified, full_name, email').eq('id', user.id).single()
  if (prof?.bgc_verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 })
  if (!prof?.bgc_paid) return NextResponse.json({ error: 'Payment required before upload' }, { status: 402 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 400 })

  // Service-role for storage + cross-row writes
  const svc = createSvcClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `bgc/${user.id}/${Date.now()}_${safeName}`
  const bytes = await file.arrayBuffer()
  const buf = Buffer.from(bytes)
  const { error: upErr } = await svc.storage.from('bgc-submissions').upload(path, buf, { contentType: file.type, upsert: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = svc.storage.from('bgc-submissions').getPublicUrl(path)

  await svc.from('profiles').update({ bgc_pending: true, bgc_document_url: publicUrl }).eq('id', user.id)
  await svc.from('certifications').insert({
    user_id: user.id,
    type: 'bgc',
    status: 'pending',
    document_url: publicUrl,
    created_at: new Date().toISOString(),
  })

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
