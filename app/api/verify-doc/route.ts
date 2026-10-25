import { sendEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { DOC_TYPES, escapeHtml, safeFileName } from '@/lib/security'
import { signedDocUrl } from '@/lib/signed-url'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  const userId = user!.id

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const tier = formData.get('tier') === 'tier2' ? 'tier2' : 'tier1'

  if (!file) {
    return NextResponse.json({ error: 'missing file' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 400 })
  }
  if (!DOC_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Upload a PDF or an image' }, { status: 400 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // the user's own folder; a new name each time, never overwriting anyone's file
  const path = `${tier}/${userId}/${Date.now()}_${safeFileName(file.name)}`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await svc.storage
    .from('verification-docs')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false })

  if (upErr) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  let publicUrl: string
  try { publicUrl = await signedDocUrl(svc, 'verification-docs', path) } catch { return NextResponse.json({ error: 'Upload failed' }, { status: 500 }) }

  // Mark pending in profile
  const updateField = tier === 'tier1' ? 'tier1_pending' : 'tier2_pending'
  await svc.from('profiles').update({
    [updateField]: true,
    [`${tier}_document_url`]: publicUrl,
  }).eq('id', userId)

  await sendEmail({to: 'verify@oversize-escort-hub.com',
    subject: `New ${tier.toUpperCase()} Verification Submission`,
    html: `<div style="font-family:sans-serif;background:#f4f4f4;padding:20px;"><div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;"><div style="background:#0a0a0a;padding:20px;text-align:center;margin-bottom:0;"><img src="https://www.oversize-escort-hub.com/logo.png" alt="Oversize Escort Hub" style="height:60px;width:auto;" /></div><div style="padding:24px;"><h2 style="color:#ff6600;margin:0 0 16px">New ${tier.toUpperCase()} Verification Submission</h2><p><b>User ID:</b> ${escapeHtml(userId)}</p><p><b>File:</b> ${escapeHtml(file.name)}</p><p><b>Doc URL:</b> <a href="${escapeHtml(publicUrl)}">${escapeHtml(publicUrl)}</a></p></div></div></div>`
  })

  return NextResponse.json({ ok: true })
}
