import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { payRecords } from '@/lib/pay-record'
import { MIN_PAY_ANSWERS } from '@/lib/quality'

export const dynamic = 'force-dynamic'

// "Paid on time N of M" per poster. Only posters with enough answers are returned. Counts only.
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const all = await payRecords(serviceClient(), ids)
  const records = Object.fromEntries(Object.entries(all).filter(([, r]) => r.total >= MIN_PAY_ANSWERS))
  return NextResponse.json({ ok: true, records }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } })
}
