import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostJobForm } from './_client'

export const metadata: Metadata = {
  title: 'Post a job',
  description: 'Post an escort or pilot car job. You describe the work and the pay in your own words.',
}

export default async function PostJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin?next=/post-job')
  return <PostJobForm />
}
