// A rough driving distance for a load: straight-line miles between the two cities times a road factor.
// It is an estimate for planning pay, never a route. Oversize loads follow their permit, which can be longer.
export const ROAD_FACTOR = 1.2

export function straightMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function roadMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  return Math.round(straightMiles(a.lat, a.lon, b.lat, b.lon) * ROAD_FACTOR)
}

async function geocode(city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},${encodeURIComponent(state)},USA&format=json&limit=1`,
      { headers: { 'User-Agent': 'OversizeEscortHub/1.0 (support@oversize-escort-hub.com)' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null
    const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon)
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
  } catch {
    return null
  }
}

/** null when either city cannot be found. Two lookups per new load, run once when the load is posted. */
export async function estimateLoadMiles(puCity: string, puState: string, dlCity: string, dlState: string): Promise<number | null> {
  const a = await geocode(puCity, puState)
  await new Promise((r) => setTimeout(r, 1100)) // the free map service allows one request a second
  const b = await geocode(dlCity, dlState)
  if (!a || !b) return null
  const miles = roadMiles(a, b)
  return miles > 0 && miles < 6000 ? miles : null
}

/** What the load pays in total at its per-mile rate, or null when either number is missing. */
export function estimatedTotal(perMile: unknown, miles: unknown): number | null {
  const r = Number(perMile), m = Number(miles)
  if (!Number.isFinite(r) || !Number.isFinite(m) || r <= 0 || m <= 0) return null
  return Math.round(r * m)
}
