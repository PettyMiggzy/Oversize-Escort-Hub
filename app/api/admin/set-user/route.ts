import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'
import { VERIFICATION_LIVE } from '@/lib/verification'

export const dynamic = 'force-dynamic'

const TIERS = ['free', 'trial', 'member', 'pro', 'carrier_member', 'fleet_starter', 'fleet_plus', 'fleet_pro']
const FLEET_TIERS = new Set(['fleet_starter', 'fleet_plus', 'fleet_pro'])
const ROLES = ['escort', 'carrier', 'admin', 'fleet_manager']

// Admin only. Sets one user's plan, role, suspension and verification badges.
// Body: { userId, tier?, role?, suspended?, pevo_verified?, bgc_verified? }.
export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const body = await req.json().catch(() => ({}))
  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const update: Record<string, unknown> = {}
  if (body.tier !== undefined) {
    if (!TIERS.includes(body.tier)) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
    update.tier = body.tier
    update.tier_updated_at = new Date().toISOString()
    // Keep role in sync with fleet plans (mirrors the Stripe webhook): the role before a fleet plan is remembered,
    // so taking the plan away puts it back (a carrier stays a carrier).
    if (body.role === undefined) {
      const { data: cur } = await svc.from('profiles').select('role, prior_role').eq('id', userId).maybeSingle()
      if (FLEET_TIERS.has(body.tier)) {
        if (cur && cur.role !== 'fleet_manager') { update.role = 'fleet_manager'; update.prior_role = cur.role ?? 'escort' }
      } else if (cur?.role === 'fleet_manager') {
        update.role = cur.prior_role ?? 'escort'
        update.prior_role = null
      }
    }
  }
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
    update.role = body.role
  }
  if (typeof body.suspended === 'boolean') update.suspended = body.suspended
  // badges are off: an admin cannot hand one out by accident
  if (VERIFICATION_LIVE && typeof body.pevo_verified === 'boolean') update.pevo_verified = body.pevo_verified
  if (VERIFICATION_LIVE && typeof body.bgc_verified === 'boolean') update.bgc_verified = body.bgc_verified
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })

  const { data, error } = await svc.from('profiles').update(update).eq('id', userId).select('id, tier, role, suspended, pevo_verified, bgc_verified')
  if (error) {
    console.error('[admin set-user]', error)
    return NextResponse.json({ error: 'Could not update the user' }, { status: 500 })
  }
  if (!data?.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ ok: true, user: data[0] })
}
