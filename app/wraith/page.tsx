import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { wraithLive } from '@/lib/wraith'
import { serviceClient } from '@/lib/service-client'
import { hasWraithAccess, wraithFreeLeft, wraithPriceId, wraithPriceText } from '@/lib/wraith-access'
import WraithClient from '@/components/wraith/WraithClient'

// Hidden and off: a plain 404 unless WRAITH_LIVE=on, signed-in people only, and never in search results or the sitemap.
export const metadata: Metadata = { title: 'Wraith', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function WraithPage({ searchParams }: { searchParams: Promise<{ subscribed?: string }> }) {
  if (!wraithLive()) notFound()
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) redirect('/signin?redirect=/wraith')
  const svc = serviceClient()
  const paid = await hasWraithAccess(svc, user.id, user.email)
  const [freeLeft, priceText, sp] = await Promise.all([paid ? Promise.resolve(null) : wraithFreeLeft(svc, user.id), wraithPriceText(), searchParams])
  return <WraithClient paid={paid} freeLeft={freeLeft} priceText={priceText} canSubscribe={!!wraithPriceId()} justSubscribed={sp?.subscribed === '1'} />
}
