import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The signed-in escort's own documents: status, expiry and whether each one is shown on the public profile. Never the file links.
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  const { data } = await serviceClient().from('certifications').select('id, type, status, expiry_date, show_on_profile, reject_reason, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ documents: data ?? [] })
}

// Turn "show on my profile" on or off for one of the escort's own documents.
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  let body: { certId?: string; show?: unknown } = {}
  try { body = await req.json() } catch { /* below */ }
  const id = String(body.certId || '')
  if (!UUID.test(id) || typeof body.show !== 'boolean') return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const svc = serviceClient()
  const { data: row } = await svc.from('certifications').select('id, user_id, status').eq('id', id).maybeSingle()
  if (!row || row.user_id !== user!.id) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  await svc.from('certifications').update({ show_on_profile: body.show }).eq('id', id).eq('user_id', user!.id)
  return NextResponse.json({ ok: true, show: body.show, live: body.show && row.status === 'approved' })
}
