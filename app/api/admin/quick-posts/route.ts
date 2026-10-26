import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// What an admin needs to spot a bad post fast: loads posted without an account that nobody has checked yet,
// and any load an escort reported.
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const svc = serviceClient()
  const since = new Date(Date.now() - 14 * 86400000).toISOString()

  const { data: posts } = await svc.from('loads')
    .select('id, carrier_id, pu_city, pu_state, dl_city, dl_state, escort_type, escort_count, per_mile_rate, status, created_at, notes')
    .eq('source', 'quick_post').is('reviewed_at', null).gte('created_at', since)
    .order('created_at', { ascending: false }).limit(100)

  const { data: reports } = await svc.from('load_reports').select('load_id, reason, created_at').order('created_at', { ascending: false }).limit(300)
  const byLoad = new Map<string, { reason: string; created_at: string }[]>()
  for (const r of (reports || []) as { load_id: string; reason: string; created_at: string }[]) {
    byLoad.set(r.load_id, [...(byLoad.get(r.load_id) || []), { reason: r.reason, created_at: r.created_at }])
  }
  const reportedIds = [...byLoad.keys()].slice(0, 50)
  const { data: reported } = reportedIds.length
    ? await svc.from('loads').select('id, carrier_id, pu_city, pu_state, dl_city, dl_state, escort_type, per_mile_rate, status, created_at, notes').in('id', reportedIds)
    : { data: [] as Record<string, unknown>[] }

  const carrierIds = [...new Set([...(posts || []), ...(reported || [])].map((l) => String((l as { carrier_id: string }).carrier_id)))]
  const { data: people } = carrierIds.length
    ? await svc.from('profiles').select('id, email, full_name, company_name, created_at, suspended').in('id', carrierIds)
    : { data: [] as Record<string, unknown>[] }
  const who = new Map((people || []).map((p) => [String((p as { id: string }).id), p as Record<string, unknown>]))

  const shape = (l: Record<string, unknown>) => {
    const p = who.get(String(l.carrier_id)) || {}
    return { ...l, poster: { email: p.email ?? null, name: p.full_name ?? null, company: p.company_name ?? null, since: p.created_at ?? null, suspended: p.suspended === true }, reports: byLoad.get(String(l.id)) || [] }
  }
  return NextResponse.json({
    quickPosts: (posts || []).map((l) => shape(l as Record<string, unknown>)),
    reported: (reported || []).map((l) => shape(l as Record<string, unknown>)).sort((a, b) => b.reports.length - a.reports.length),
  })
}

// ok = looks fine (stops showing here), remove = take the load down, ban = take down every open load and suspend the account
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  let body: { loadId?: string; action?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const loadId = String(body.loadId || '')
  const action = String(body.action || '')
  if (!UUID.test(loadId) || !['ok', 'remove', 'ban'].includes(action)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const svc = serviceClient()
  const now = new Date().toISOString()
  const { data: load } = await svc.from('loads').select('id, carrier_id').eq('id', loadId).maybeSingle()
  if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })

  if (action === 'ok') {
    await svc.from('loads').update({ reviewed_at: now }).eq('id', loadId)
  } else if (action === 'remove') {
    await svc.from('loads').update({ status: 'cancelled', reviewed_at: now }).eq('id', loadId)
  } else {
    const carrierId = String(load.carrier_id)
    await svc.from('profiles').update({ suspended: true }).eq('id', carrierId)
    await svc.from('loads').update({ status: 'cancelled', reviewed_at: now }).eq('carrier_id', carrierId).in('status', ['open', 'pending_match'])
  }
  return NextResponse.json({ ok: true, action })
}
