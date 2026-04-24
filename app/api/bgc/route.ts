import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null
  if (!file || !userId) return NextResponse.json({ error: 'missing file or userId' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 400 })
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const path = `bgc/${Date.now()}_${file.name}`
  const bytes = await file.arrayBuffer()
  const { error: upErr } = await svc.storage.from('bgc-submissions').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  const { data: { publicUrl } } = svc.storage.from('bgc-submissions').getPublicUrl(path)
  await svc.from('profiles').update({ bgc_pending: true, bgc_document_url: publicUrl }).eq('id', userId)
  await svc.from('certifications').insert({
    user_id: userId,
    type: 'bgc',
    status: 'pending',
    document_url: publicUrl,
    created_at: new Date().toISOString()
  })
  return NextResponse.json({ ok: true, url: publicUrl })
}
