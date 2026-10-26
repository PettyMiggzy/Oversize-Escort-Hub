import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { DOC_LIMITS, isPublic, parseStorageUrl, type DocRow } from '@/lib/profile-docs'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const gone = () => new NextResponse('Not found', { status: 404, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })

// A visitor opens a document an escort chose to show. Only an approved, switched-on, unexpired document gets a link,
// and the link works for five minutes. The stored file address is never handed out.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ certId: string }> }) {
  const { certId } = await ctx.params
  if (!UUID.test(certId)) return gone()
  const svc = serviceClient()
  const { data: row } = await svc.from('certifications').select('id, user_id, type, status, expiry_date, show_on_profile, document_url').eq('id', certId).maybeSingle()
  if (!row || !isPublic(row as DocRow)) return gone()
  const where = parseStorageUrl((row as DocRow).document_url)
  if (!where) return gone()
  const { data, error } = await svc.storage.from(where.bucket).createSignedUrl(where.path, DOC_LIMITS.linkSeconds)
  if (error || !data?.signedUrl) return gone()
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
}
