import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { typicalRates } from '@/lib/rates'

export const dynamic = 'force-dynamic'

// What open loads pay per mile right now (middle value and range). Public, aggregated, no names. Not advice.
export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')
  const rate = await typicalRates(serviceClient(), state)
  return NextResponse.json({ ok: true, rate }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } })
}
