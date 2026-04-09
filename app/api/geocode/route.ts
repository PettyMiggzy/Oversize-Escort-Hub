import { NextRequest, NextResponse } from "next/server"

// Nominatim Geocoding — free, no key required
// Docs: https://nominatim.openstreetmap.org/ui/about.html
// Rate limit: 1 req/sec — cache results in Supabase for production

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")
  const state = req.nextUrl.searchParams.get("state")
  const q = req.nextUrl.searchParams.get("q")

  const query = q || [city, state].filter(Boolean).join(", ")
  if (!query) {
    return NextResponse.json({ error: "Provide city+state or q parameter" }, { status: 400 })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us,ca`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "OversizeEscortHub/1.0 (contact@oeh.com)",
        "Accept": "application/json",
      },
    })
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding failed", status: res.status }, { status: 200 })
    }
    const data = await res.json()
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Location not found", query }, { status: 200 })
    }
    const result = data[0]
    return NextResponse.json({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      type: result.type,
      query,
    })
  } catch (e) {
    return NextResponse.json({ error: "Geocoding error", detail: String(e) }, { status: 200 })
  }
}
