import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/supabase'
import { FleetDashboardPageClient } from './_client'

const FLEET_TIERS = new Set(['fleet_starter', 'fleet_plus', 'fleet_pro'])

export default async function FleetDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')
  const { data: prof } = await supabase
    .from('profiles')
    .select('role, tier, email')
    .eq('id', user.id)
    .maybeSingle()
  const ok =
    isAdminEmail(user.email ?? '') ||
    isAdminEmail(prof?.email) ||
    (prof?.role === 'fleet_manager' && FLEET_TIERS.has(prof?.tier || ''))
  if (!ok) redirect('/pricing')
  return <FleetDashboardPageClient />
}
