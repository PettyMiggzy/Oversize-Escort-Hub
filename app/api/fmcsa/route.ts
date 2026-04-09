import { NextRequest, NextResponse } from "next/server"

// FMCSA QCMobile API — free key required
// Register at: https://ai.fmcsa.dot.gov/SMS/tools/webservices.aspx
// Add FMCSA_API_KEY to .env.local


export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const dot = req.nextUrl.searchParams.get("dot")
  const mc  = req.nextUrl.searchParams.get("mc")
  const apiKey = process.env.FMCSA_API_KEY

  if (!dot && !mc) {
    return NextResponse.json({ error: "Provide dot or mc parameter" }, { status: 400 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: "FMCSA_API_KEY not configured", mock: true, verified: false }, { status: 200 })
  }

  try {
    // FMCSA QCMobile API endpoint
    const param = dot ? `dotNumber/${dot}` : `mc_mx_ff_numbers/${mc}`
    const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${param}?webKey=${apiKey}`
    const res = await fetch(url, { headers: { "Accept": "application/json" } })
    if (!res.ok) {
      return NextResponse.json({ verified: false, error: "FMCSA lookup failed", status: res.status }, { status: 200 })
    }
    const data = await res.json()
    const carrier = data?.content?.carrier
    if (!carrier) {
      return NextResponse.json({ verified: false, error: "Carrier not found" }, { status: 200 })
    }
    return NextResponse.json({
      verified: true,
      dotNumber: carrier.dotNumber,
      legalName: carrier.legalName,
      dbaName: carrier.dbaName,
      allowedToOperate: carrier.allowedToOperate,
      carrierOperation: carrier.carrierOperation?.carrierOperationDesc,
      phyState: carrier.phyState,
    })
  } catch (e) {
    return NextResponse.json({ verified: false, error: "FMCSA API error" }, { status: 200 })
  }
}
