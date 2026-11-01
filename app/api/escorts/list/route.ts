import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

// The public escort finder list. Suspended accounts are left out here on the server: the
// `suspended` column is not readable by the browser (column grants), so the page cannot filter on it.
export async function GET(req: Request) {
  const member = new URL(req.url).searchParams.get('member')
  let q = serviceClient()
    .from('profiles')
    .select('id, full_name, tier, bgc_verified, equipment, total_jobs')
    .eq('role', 'escort')
    .or('suspended.is.null,suspended.eq.false')
    .limit(500)
  if (member === 'pro') q = q.eq('tier', 'pro')
  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Could not load escorts' }, { status: 500 })
  return NextResponse.json({ escorts: data ?? [] })
}
