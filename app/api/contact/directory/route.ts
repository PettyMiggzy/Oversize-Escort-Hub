import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

// Admin user list. The browser cannot select email, phone, or Stripe ids on other rows.
const COLUMNS = 'id, full_name, email, role, tier, bgc_verified, pevo_verified, created_at, suspended, phone, stripe_customer_id, tier_updated_at, sms_opt_in'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const { data, error: dbErr } = await serviceClient()
    .from('profiles')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (dbErr) return NextResponse.json({ error: 'Could not load users' }, { status: 500 })
  return NextResponse.json({ users: data || [] })
}
