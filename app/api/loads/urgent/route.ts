import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { isAdminEmail } from '@/lib/supabase'
import { alertEscortsNewLoad, alertRegularsNewLoad, alertUrgentLoad, runAfter } from '@/lib/alerts'
import { regularsMinutes } from '@/lib/quality'
import { countRegulars } from '@/lib/quality-server'

export const dynamic = 'force-dynamic'

// Body: { load_id, regulars_minutes? }
// The load's carrier turns an open load urgent, or reopens a filled one as urgent when their escort cancels
// ("find a replacement now"). Escorts who said they are available in the pickup state are alerted right away.
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const loadId = typeof body.load_id === 'string' ? body.load_id : ''
  if (!/^[0-9a-f-]{36}$/i.test(loadId)) return NextResponse.json({ error: 'Missing load' }, { status: 400 })
  const svc = serviceClient()
  const { data: load } = await svc.from('loads').select('id, carrier_id, status, board_type, urgent, matched_escort_id, pu_city, pu_state, dl_city, dl_state').eq('id', loadId).maybeSingle()
  if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
  const admin = isAdminEmail(user!.email ?? '')
  if (load.carrier_id !== user!.id && !admin) return NextResponse.json({ error: 'Only the carrier who posted this load can do that' }, { status: 403 })
  if (!['open', 'pending_match', 'filled'].includes(String(load.status))) return NextResponse.json({ error: 'This load is closed' }, { status: 409 })

  const reopen = load.status !== 'open'
  const previousEscort: string | null = load.matched_escort_id ?? null
  if (!reopen && load.urgent) return NextResponse.json({ error: 'This load is already urgent' }, { status: 409 })

  // a reopened load gives the carrier's regulars a short first look (5 minutes unless they asked otherwise)
  let mins = regularsMinutes(body.regulars_minutes ?? (reopen ? 5 : 0))
  if (mins && (await countRegulars(svc, load.carrier_id)) === 0) mins = 0
  const now = Date.now()
  const patch: Record<string, unknown> = {
    urgent: true,
    urgent_at: new Date(now).toISOString(),
    regulars_until: mins ? new Date(now + mins * 60000).toISOString() : null,
    alerts_pending: mins > 0,
  }
  if (reopen) {
    patch.status = 'open'
    patch.matched_escort_id = null
    patch.match_requested_at = null
    patch.expires_at = new Date(now + (load.board_type === 'bid' ? 5 * 60000 : 24 * 3600000)).toISOString()
  }
  const { data: updated, error: upErr } = await svc.from('loads').update(patch).eq('id', loadId).eq('status', load.status).select('id')
  if (upErr) return NextResponse.json({ error: 'Could not update the load' }, { status: 500 })
  if (!updated?.length) return NextResponse.json({ error: 'The load just changed. Look again and retry.' }, { status: 409 })

  if (reopen && previousEscort) {
    try { await svc.from('notifications').insert({ user_id: previousEscort, message: `The carrier reopened ${load.pu_city}, ${load.pu_state} to ${load.dl_city}, ${load.dl_state}. It is no longer yours.` }) } catch {}
  }
  runAfter(async () => {
    if (mins) { await alertRegularsNewLoad(loadId); return }
    await Promise.allSettled([alertUrgentLoad(loadId), reopen ? alertEscortsNewLoad(loadId) : Promise.resolve()])
  })
  return NextResponse.json({ ok: true, reopened: reopen, regulars_minutes: mins })
}
