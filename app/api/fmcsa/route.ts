export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

// FMCSA QCMobile API — free key required, set FMCSA_API_KEY in env
// Docs: https://mobile.fmcsa.dot.gov/qc/services/carriers/{dotNumber}?webKey={key}
export async function GET(req: NextRequest) {
  const dot = req.nextUrl.searchParams.get('dot')
  if (!dot) return NextResponse.json({ error: 'dot param required' }, { status: 400 })
  const apiKey = process.env.FMCSA_API_KEY
  if (!apiKey) {
    // No key configured — return unverified gracefully
    return NextResponse.json({ verified: false, reason: 'FMCSA_API_KEY not configured' })
  }
  try {
    const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(dot)}?webKey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return NextResponse.json({ verified: false, reason: `FMCSA returned ${res.status}` })
    }
    const data = await res.json()
    const carrier = data?.content?.carrier
    if (!carrier) return NextResponse.json({ verified: false, reason: 'Not found in FMCSA database' })
    return NextResponse.json({
      verified: true,
      legalName: carrier.legalName ?? carrier.dbaName ?? '',
      dotNumber: carrier.dotNumber,
      mcNumber: carrier.mcNumber ?? null,
      operatingStatus: carrier.allowedToOperate === 'Y' ? 'active' : 'inactive',
      outOfService: carrier.oosDate ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ verified: false, reason: e.message })
  }
}
