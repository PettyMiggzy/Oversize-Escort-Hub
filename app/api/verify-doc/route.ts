import { sendEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null
  const tier = (formData.get('tier') as string | null) ?? 'tier1'

  if (!file || !userId) {
    return NextResponse.json({ error: 'missing file or userId' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 400 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const path = `${tier}/${Date.now()}_${file.name}`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await svc.storage
    .from('verification-docs')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = svc.storage.from('verification-docs').getPublicUrl(path)

  // Mark pending in profile
  const updateField = tier === 'tier1' ? 'tier1_pending' : 'tier2_pending'
  await svc.from('profiles').update({
    [updateField]: true,
    [`${tier}_document_url`]: publicUrl,
  }).eq('id', userId)

    await sendEmail({to: 'verify@oversize-escort-hub.com',
    subject: `New ${tier.toUpperCase()} Verification Submission`,
    html: `<div style="font-family:sans-serif;background:#f4f4f4;padding:20px;"><div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;"><div style="background:#0a0a0a;padding:20px;text-align:center;margin-bottom:0;"><img src="https://www.oversize-escort-hub.com/logo.png" alt="Oversize Escort Hub" style="height:60px;width:auto;" /></div><div style="padding:24px;"><h2 style="color:#ff6600;margin:0 0 16px">New ${tier.toUpperCase()} Verification Submission</h2><p><b>User ID:</b> ${userId}</p><p><b>File:</b> ${file.name}</p><p><b>Doc URL:</b> <a href="${publicUrl}">${publicUrl}</a></p></div></div></div>`
  })

  return NextResponse.json({ ok: true, url: publicUrl })
    }
