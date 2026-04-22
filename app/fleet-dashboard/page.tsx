import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FleetDashboardPageClient } from './_client'

export default async function FleetDashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/signin')
  return <FleetDashboardPageClient />
}
