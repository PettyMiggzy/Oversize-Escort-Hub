import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { wraithLive } from '@/lib/wraith'
import WraithClient from '@/components/wraith/WraithClient'

// Hidden and off: a plain 404 unless WRAITH_LIVE=on, signed-in people only, and never in search results or the sitemap.
export const metadata: Metadata = { title: 'Wraith', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function WraithPage() {
  if (!wraithLive()) notFound()
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) redirect('/signin?redirect=/wraith')
  return <WraithClient />
}
