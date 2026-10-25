import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { isAdminEmail } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Fleet managers add an escort by the email they already know. The browser must not
// filter profiles.email itself. The response is id, name, and role — not phone or email.
export async function POST(req: NextRequest) {
  const { user, supabase, error } = await requireAuth()
  if (error || !supabase || !user) return error!

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const allowed = me?.role === 'fleet_manager' || me?.role === 'admin' || isAdminEmail(user.email)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const { data } = await serviceClient()
    .from('profiles')
    .select('id, full_name, role')
    .eq('email', email)
    .maybeSingle()
  // A fleet manager only adds escorts, so any other account answers the same as "not found".
  // That stops the lookup from confirming which emails belong to carriers or brokers.
  const isAdmin = me?.role === 'admin' || isAdminEmail(user.email)
  if (!data || (data.role !== 'escort' && !isAdmin)) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({
    profile: { id: data.id, full_name: data.full_name ?? null, role: data.role ?? null },
  })
}
