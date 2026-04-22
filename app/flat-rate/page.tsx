import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FlatRateBoardClient } from './_client'

export default async function FlatRateBoard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/signin')
  return <FlatRateBoardClient />
}
