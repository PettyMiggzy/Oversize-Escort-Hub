import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const TIERS = ['free', 'trial', 'member', 'pro', 'carrier_member', 'fleet_starter', 'fleet_plus', 'fleet_pro']
const ROLES = ['escort', 'carrier', 'admin']

// Admin only. Sets one user's plan, role and verification badges (for example the app-store reviewers' accounts).
// Body: { userId, tier?, role?, pevo_verified?, bgc_verified? }. Nothing else can be set through here.
export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const body = await req.json().catch(() => ({}))
  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (body.tier !== undefined) {
    if (!TIERS.includes(body.tier)) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
    update.tier = body.tier
    update.tier_updated_at = new Date().toISOString()
  }
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
    update.role = body.role
  }
  if (typeof body.pevo_verified === 'boolean') update.pevo_verified = body.pevo_verified
  if (typeof body.bgc_verified === 'boolean') update.bgc_verified = body.bgc_verified
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await svc.from('profiles').update(update).eq('id', userId).select('id, tier, role, pevo_verified, bgc_verified')
  if (error) {
    console.error('[admin set-user]', error)
    return NextResponse.json({ error: 'Could not update the user' }, { status: 500 })
  }
  if (!data?.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ ok: true, user: data[0] })
}
