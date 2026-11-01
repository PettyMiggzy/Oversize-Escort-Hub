import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { isBlockedEitherWay } from '@/lib/blocks'
import { isAdminEmail } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
const MAX_REGULARS = 50
const CAN_STAR = new Set(['carrier', 'broker', 'fleet_manager', 'admin'])

// A carrier's regulars: pilot cars they like to call first. They get first look at loads when the carrier asks for it.
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  const svc = serviceClient()
  const { data: favs } = await svc.from('favorite_escorts').select('escort_id, created_at').eq('carrier_id', user!.id).order('created_at', { ascending: false })
  const ids = (favs ?? []).map((f: { escort_id: string }) => f.escort_id)
  if (!ids.length) return NextResponse.json({ ok: true, regulars: [] })
  const { data: people } = await svc.from('profiles').select('id, full_name, avg_rating, review_count, equipment, suspended').in('id', ids)
  const regulars = (people ?? []).filter((p: { suspended?: boolean | null }) => !p.suspended).map((p: { id: string; full_name?: string | null; avg_rating?: number | null; review_count?: number | null; equipment?: string[] | null }) => ({ escort_id: p.id, name: p.full_name || 'Pilot car', rating: p.avg_rating ?? null, reviews: p.review_count ?? 0, equipment: p.equipment ?? [] }))
  return NextResponse.json({ ok: true, regulars })
}

// Body: { escort_id, on: true | false }
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const escortId = typeof body.escort_id === 'string' ? body.escort_id : ''
  const on = body.on !== false
  if (!/^[0-9a-f-]{36}$/i.test(escortId)) return NextResponse.json({ error: 'Pick a pilot car' }, { status: 400 })
  const svc = serviceClient()
  const { data: me } = await svc.from('profiles').select('role').eq('id', user!.id).maybeSingle()
  if (!(me && CAN_STAR.has(String(me.role))) && !isAdminEmail(user!.email ?? '')) return NextResponse.json({ error: 'Regulars are for carriers, brokers and fleet managers' }, { status: 403 })
  if (escortId === user!.id) return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 })
  if (!on) {
    await svc.from('favorite_escorts').delete().eq('carrier_id', user!.id).eq('escort_id', escortId)
    return NextResponse.json({ ok: true, on: false })
  }
  const { data: target } = await svc.from('profiles').select('role, suspended').eq('id', escortId).maybeSingle()
  if (!target || target.role !== 'escort' || target.suspended) return NextResponse.json({ error: 'Pilot car not found' }, { status: 404 })
  if (await isBlockedEitherWay(svc, user!.id, escortId)) return NextResponse.json({ error: 'You cannot add this pilot car' }, { status: 403 })
  const { data: mine } = await svc.from('favorite_escorts').select('escort_id').eq('carrier_id', user!.id)
  if ((mine?.length ?? 0) >= MAX_REGULARS) return NextResponse.json({ error: `You can keep up to ${MAX_REGULARS} regulars` }, { status: 409 })
  const { error: insErr } = await svc.from('favorite_escorts').insert({ carrier_id: user!.id, escort_id: escortId })
  if (insErr && insErr.code !== '23505') return NextResponse.json({ error: 'Could not add them' }, { status: 500 })
  return NextResponse.json({ ok: true, on: true })
}
