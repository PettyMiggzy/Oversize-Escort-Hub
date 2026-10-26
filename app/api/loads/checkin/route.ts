import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { KEEP_FOR_MS, verifyLoadCheckToken } from '@/lib/load-lifecycle'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The poster answers the "still need escorts?" email from the link in it (no password: the link carries a signed, 3-day token).
//   keep   -> back on the board for 24 more hours (also puts back a load escorts reported as taken)
//   close  -> off the board, because it is filled or found elsewhere
export async function POST(req: NextRequest) {
  let body: { loadId?: string; token?: string; action?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const id = String(body.loadId || '')
  const action = body.action === 'keep' || body.action === 'close' ? body.action : null
  if (!UUID.test(id) || !action || !verifyLoadCheckToken(id, body.token)) return NextResponse.json({ error: 'This link is not valid any more. Sign in and manage the load from your dashboard.' }, { status: 403 })

  const svc = serviceClient()
  const { data: load } = await svc.from('loads').select('id, status, taken_flagged_at').eq('id', id).maybeSingle()
  if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })
  const now = new Date().toISOString()

  if (action === 'close') {
    // a filled or matched load is finished business; only a live post can be taken down from here
    if (load.status === 'open' || load.status === 'expired') await svc.from('loads').update({ status: 'cancelled' }).eq('id', id).in('status', ['open', 'expired'])
    return NextResponse.json({ ok: true, status: load.status === 'open' || load.status === 'expired' ? 'cancelled' : load.status })
  }
  // keep: a live post is extended; a post that escorts reported as taken may be put back (never one an admin or the spam guard removed)
  const reopenable = load.status === 'open' || (load.status === 'cancelled' && !!load.taken_flagged_at) || load.status === 'expired'
  if (!reopenable) return NextResponse.json({ error: 'This load can no longer be put back. Post it again from your dashboard.' }, { status: 409 })
  await svc.from('loads').update({ status: 'open', expires_at: new Date(Date.now() + KEEP_FOR_MS).toISOString(), checkin_sent_at: null, taken_flagged_at: null, relisted_at: now }).eq('id', id).in('status', ['open', 'expired', 'cancelled'])
  return NextResponse.json({ ok: true, status: 'open' })
}
