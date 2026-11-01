import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { cleanEquipment } from '@/lib/quality'

export const dynamic = 'force-dynamic'

// An escort lists the equipment on their own rig. We do not check it: it is shown as "listed by the escort".
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  const { data } = await serviceClient().from('profiles').select('equipment, role').eq('id', user!.id).maybeSingle()
  const role = (data as { role?: string } | null)?.role
  return NextResponse.json({ ok: true, equipment: cleanEquipment((data as { equipment?: unknown } | null)?.equipment), canEdit: role === 'escort' || role === 'fleet_manager' || role === 'admin' })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const equipment = cleanEquipment(body.equipment)
  const svc = serviceClient()
  const { data: me } = await svc.from('profiles').select('role').eq('id', user!.id).maybeSingle()
  if (!me || (me.role !== 'escort' && me.role !== 'fleet_manager' && me.role !== 'admin')) return NextResponse.json({ error: 'Only pilot cars list equipment' }, { status: 403 })
  const { error: upErr } = await svc.from('profiles').update({ equipment }).eq('id', user!.id)
  if (upErr) return NextResponse.json({ error: 'Could not save your equipment' }, { status: 500 })
  return NextResponse.json({ ok: true, equipment })
}
