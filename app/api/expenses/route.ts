import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const KINDS = ['mileage','fuel','lodging','meal','toll','other'] as const
type Kind = typeof KINDS[number]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('escort_expenses')
    .select('*')
    .eq('escort_id', user.id)
    .order('incurred_on', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expenses: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const kind = String(body.kind || '') as Kind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'invalid kind' }, { status: 400 })
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
  const miles = body.miles == null || body.miles === '' ? null : Number(body.miles)
  if (miles != null && !Number.isFinite(miles)) return NextResponse.json({ error: 'invalid miles' }, { status: 400 })
  const row: any = {
    escort_id: user.id,
    kind,
    amount,
    miles,
    note: body.note ? String(body.note).slice(0, 500) : null,
    load_id: body.load_id || null,
  }
  if (body.incurred_on) row.incurred_on = body.incurred_on
  const { data, error } = await supabase.from('escort_expenses').insert(row).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('escort_expenses').delete().eq('id', id).eq('escort_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
