import { NextRequest, NextResponse } from 'next/server'
import { isBlockedEitherWay } from '@/lib/blocks'
import { requireAdmin, requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

const OPEN = new Set(['filled', 'pending_match'])

// Phone and email of the other party on a load. Allowed only when the caller is the
// carrier or the matched escort and the load is filled or pending_match, or the caller is an admin.
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const userId = req.nextUrl.searchParams.get('userId')?.trim() || ''
  const loadId = req.nextUrl.searchParams.get('loadId')?.trim() || ''
  if (!userId) return NextResponse.json({ error: 'Missing user' }, { status: 400 })

  const admin = await requireAdmin()
  const isAdmin = !admin.error
  const svc = serviceClient()

  if (!isAdmin) {
    if (!loadId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data: load } = await svc
      .from('loads')
      .select('id, status, carrier_id, matched_escort_id')
      .eq('id', loadId)
      .maybeSingle()
    if (!load) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!OPEN.has(String(load.status))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const caller = user!.id
    const onLoad = caller === load.carrier_id || caller === load.matched_escort_id
    if (!onLoad) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const other = caller === load.carrier_id ? load.matched_escort_id : load.carrier_id
    if (!other || userId !== other) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (await isBlockedEitherWay(svc, caller, other)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profile } = await svc
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', userId)
    .maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    full_name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    email: profile.email ?? null,
  })
}
