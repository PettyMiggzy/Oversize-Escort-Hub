import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BidBoardClient } from './_client'

export default async function BidBoard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/signin')
  return <BidBoardClient />
}
