import { NextRequest, NextResponse } from "next/server"

// NWS Weather API — no key required
// Docs: https://www.weather.gov/documentation/services-web-api


export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat")
  // the weather page sends "lng"; other callers send "lon"
  const lon = req.nextUrl.searchParams.get("lon") ?? req.nextUrl.searchParams.get("lng")
  const city = req.nextUrl.searchParams.get("city")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Provide lat and lon parameters" }, { status: 400 })
  }

  // numbers only: they are placed in the NWS URL path
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lon)) > 180) {
    return NextResponse.json({ error: "lat and lon must be numbers" }, { status: 400 })
  }

  try {
    // Step 1: Get forecast grid point
    const pointRes = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`,
      { headers: { "User-Agent": "OversizeEscortHub/1.0 (contact@oeh.com)" } }
    )
    if (!pointRes.ok) {
      return NextResponse.json({ error: "Could not get NWS grid point", lat, lon }, { status: 200 })
    }
    const pointData = await pointRes.json()
    const forecastUrl = pointData?.properties?.forecast
    const forecastHourlyUrl = pointData?.properties?.forecastHourly
    const alertsZone = pointData?.properties?.county
    if (!forecastUrl) return NextResponse.json({ error: "No forecast for this location", lat, lon }, { status: 200 })

    // Step 2: Get forecast
    const [forecastRes, alertsRes] = await Promise.all([
      fetch(forecastUrl, { headers: { "User-Agent": "OversizeEscortHub/1.0" } }),
      fetch(`https://api.weather.gov/alerts/active?zone=${encodeURIComponent(alertsZone || "")}`,
        { headers: { "User-Agent": "OversizeEscortHub/1.0" } }),
    ])

    const forecastData = forecastRes.ok ? await forecastRes.json() : null
    const alertsData = alertsRes.ok ? await alertsRes.json() : null

    const periods = forecastData?.properties?.periods?.slice(0, 14) || []
    const alerts = (alertsData?.features || []).map((a: any) => ({
      event: a.properties?.event,
      headline: a.properties?.headline,
      severity: a.properties?.severity,
    }))

    return NextResponse.json({
      city: city || `${lat},${lon}`,
      updated: new Date().toISOString(),
      current: periods[0] ? {
        name: periods[0].name,
        temp: periods[0].temperature,
        unit: periods[0].temperatureUnit,
        wind: periods[0].windSpeed,
        windDir: periods[0].windDirection,
        icon: periods[0].icon,
        short: periods[0].shortForecast,
        detail: periods[0].detailedForecast,
        isDaytime: periods[0].isDaytime,
      } : null,
      forecast: periods.slice(0, 7).map((p: any) => ({
        name: p.name,
        temp: p.temperature,
        unit: p.temperatureUnit,
        wind: p.windSpeed,
        icon: p.icon,
        short: p.shortForecast,
        isDaytime: p.isDaytime,
      })),
      alerts,
    })
  } catch (e) {
    console.error("[weather]", e)
    return NextResponse.json({ error: "NWS API error" }, { status: 200 })
  }
}
