import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { sendEmail } from '@/lib/email'
import { ADMIN_EMAILS } from '@/lib/supabase'
import { runAfter } from '@/lib/alerts'
import { sendTakenEmail, TAKEN_THRESHOLD } from '@/lib/load-lifecycle'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REPORT_REASONS = ['taken', 'scam', 'spam', 'fake_rate', 'duplicate', 'other'] as const
const AUTO_HIDE_AT = 3

// A signed-in user reports a load. One report per person per load.
//  - "already taken": two different escorts take it off the board and the poster is emailed (one tap puts it back)
//  - anything else: three different people take it off until an admin looks; the admins are emailed either way.
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  let body: { loadId?: string; reason?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const loadId = String(body.loadId || '')
  const reason = REPORT_REASONS.find((r) => r === body.reason)
  if (!UUID.test(loadId) || !reason) return NextResponse.json({ error: 'Pick a reason' }, { status: 400 })

  const svc = serviceClient()
  const { data: load } = await svc.from('loads').select('id, carrier_id, status, pu_city, pu_state, dl_city, dl_state, relisted_at').eq('id', loadId).maybeSingle()
  if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
  if (load.carrier_id === user!.id) return NextResponse.json({ error: 'You cannot report your own load' }, { status: 400 })

  const { data: mine } = await svc.from('load_reports').select('id').eq('load_id', loadId).eq('reporter_id', user!.id).limit(1)
  if (!mine || mine.length === 0) {
    const { error: insErr } = await svc.from('load_reports').insert({ load_id: loadId, reporter_id: user!.id, reason })
    if (insErr) return NextResponse.json({ error: 'Could not send the report' }, { status: 500 })
  }
  const { data: all } = await svc.from('load_reports').select('reporter_id, reason, created_at').eq('load_id', loadId).limit(100)
  const rows = (all || []) as { reporter_id: string; reason: string; created_at: string }[]
  // spam-type reports: three different people hide the load until an admin looks
  const people = new Set(rows.filter((r) => r.reason !== 'taken').map((r) => String(r.reporter_id)))
  let hidden = false
  if (people.size >= AUTO_HIDE_AT && load.status === 'open') {
    await svc.from('loads').update({ status: 'cancelled' }).eq('id', loadId).eq('status', 'open')
    hidden = true
  }
  // "already taken": two different escorts (not the poster) since the load was last put up take it down; the poster can put it back
  let taken = false
  const takenIds = [...new Set(rows.filter((r) => r.reason === 'taken' && (!load.relisted_at || Date.parse(r.created_at) > Date.parse(load.relisted_at))).map((r) => String(r.reporter_id)))]
  if (takenIds.length >= TAKEN_THRESHOLD && load.status === 'open' && !hidden) {
    const { data: who } = await svc.from('profiles').select('id, role').in('id', takenIds)
    const escorts = ((who || []) as { id: string; role: string }[]).filter((p) => p.role === 'escort')
    if (escorts.length >= TAKEN_THRESHOLD) {
      const { data: down } = await svc.from('loads').update({ status: 'cancelled', taken_flagged_at: new Date().toISOString() }).eq('id', loadId).eq('status', 'open').select('id')
      if (down?.length) {
        taken = true
        const { data: owner } = await svc.from('profiles').select('email').eq('id', load.carrier_id).maybeSingle()
        if (owner?.email) await sendTakenEmail(owner.email, load)
      }
    }
  }
  // a pure "already taken" report is the poster's business, not an admin's
  if (reason === 'taken') return NextResponse.json({ ok: true, taken })
  const route = `${load.pu_city}, ${load.pu_state} to ${load.dl_city}, ${load.dl_state}`
  runAfter(async () => {
    await Promise.allSettled(ADMIN_EMAILS.map((to) => sendEmail({
      to,
      subject: `Load reported (${people.size}): ${route}`,
      html: `<p style="font-family:Arial,sans-serif">${people.size} report(s), latest reason: ${reason}.${hidden ? ' It was taken off the board automatically.' : ''}<br>${route}<br><a href="https://www.oversize-escort-hub.com/admin">Open the admin panel &gt; Quick posts</a></p>`,
    })))
  })
  return NextResponse.json({ ok: true })
}
