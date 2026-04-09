export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

// NWS Weather API — completely free, no API key needed
// Uses Nominatim (OpenStreetMap) for geocoding — free, no key needed
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city')
  const state = req.nextUrl.searchParams.get('state')
  if (!city || !state) {
    return NextResponse.json({ error: 'city and state params required' }, { status: 400 })
  }
  try {
    // Step 1: Geocode with Nominatim (free, no key)
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', ' + state + ', USA')}&format=json&limit=1`
    const geoRes = await fetch(geoUrl, {
      headers: { 'User-Agent': 'OversizeEscortHub/1.0 (contact@oversizeescorthub.com)' },
      next: { revalidate: 86400 },
    })
    const geoData = await geoRes.json()
    if (!geoData.length) return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    const lat = parseFloat(geoData[0].lat).toFixed(4)
    const lon = parseFloat(geoData[0].lon).toFixed(4)

    // Step 2: Get NWS grid point
    const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { 'User-Agent': 'OversizeEscortHub/1.0 (contact@oversizeescorthub.com)' },
      next: { revalidate: 3600 },
    })
    if (!pointRes.ok) return NextResponse.json({ error: 'NWS point lookup failed' }, { status: 502 })
    const pointData = await pointRes.json()
    const forecastUrl = pointData.properties?.forecast
    const hourlyUrl = pointData.properties?.forecastHourly
    const alertsZone = pointData.properties?.county

    // Step 3: Get current conditions from hourly forecast
    const [forecastRes, alertsRes] = await Promise.all([
      fetch(hourlyUrl, {
        headers: { 'User-Agent': 'OversizeEscortHub/1.0 (contact@oversizeescorthub.com)' },
        next: { revalidate: 1800 },
      }),
      alertsZone
        ? fetch(`https://api.weather.gov/alerts/active?zone=${alertsZone.split('/').pop()}`, {
            headers: { 'User-Agent': 'OversizeEscortHub/1.0 (contact@oversizeescorthub.com)' },
            next: { revalidate: 900 },
          })
        : Promise.resolve(null),
    ])

    const forecastData = forecastRes.ok ? await forecastRes.json() : null
    const alertsData = alertsRes?.ok ? await alertsRes.json() : null

    const current = forecastData?.properties?.periods?.[0]
    const alerts = alertsData?.features?.slice(0, 3).map((a: any) => ({
      event: a.properties.event,
      headline: a.properties.headline,
      severity: a.properties.severity,
    })) ?? []

    return NextResponse.json({
      city,
      state,
      lat,
      lon,
      current: current
        ? {
            temp: current.temperature,
            unit: current.temperatureUnit,
            wind: current.windSpeed,
            windDir: current.windDirection,
            shortForecast: current.shortForecast,
            icon: current.icon,
            isDaytime: current.isDaytime,
          }
        : null,
      alerts,
      forecastUrl,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
