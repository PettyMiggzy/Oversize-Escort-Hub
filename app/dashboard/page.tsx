import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardPageClient } from './_client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/signin')
  return <DashboardPageClient />
}
