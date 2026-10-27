import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { blockedIds } from '@/lib/blocks'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET: the people I blocked (with names) and the ids that blocked me (ids only, so lists can hide them both ways).
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  const svc = serviceClient()
  const { iBlocked, blockedMe } = await blockedIds(svc, user!.id)
  let blocked: { id: string; name: string }[] = []
  if (iBlocked.length) {
    const { data } = await svc.from('profiles').select('id, full_name, company_name').in('id', iBlocked)
    const names = new Map(((data || []) as { id: string; full_name: string | null; company_name: string | null }[]).map((p) => [p.id, p.full_name || p.company_name || 'Former user']))
    blocked = iBlocked.map((id) => ({ id, name: names.get(id) || 'Former user' }))
  }
  return NextResponse.json({ blocked, hidden: [...new Set([...iBlocked, ...blockedMe])] })
}

// POST { userId, action: 'block' | 'unblock' }
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  let body: { userId?: string; action?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const userId = String(body.userId || '')
  if (!UUID.test(userId) || (body.action !== 'block' && body.action !== 'unblock')) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  if (userId === user!.id) return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 })
  const svc = serviceClient()
  if (body.action === 'unblock') {
    await svc.from('user_blocks').delete().eq('blocker_id', user!.id).eq('blocked_id', userId)
    return NextResponse.json({ ok: true })
  }
  const { data: target } = await svc.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const { data: already } = await svc.from('user_blocks').select('blocker_id').eq('blocker_id', user!.id).eq('blocked_id', userId).limit(1)
  if (!already || already.length === 0) {
    const { error: insErr } = await svc.from('user_blocks').insert({ blocker_id: user!.id, blocked_id: userId })
    if (insErr && insErr.code !== '23505') return NextResponse.json({ error: 'Could not block this user' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
