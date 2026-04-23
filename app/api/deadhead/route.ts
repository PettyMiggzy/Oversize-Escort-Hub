import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function geocode(city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},${encodeURIComponent(state)},USA&format=json&limit=1`,
      { headers: { 'User-Agent': 'OversizeEscortHub/1.0' } }
    )
    const data = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

async function sendSMS(phone: string, message: string) {
  const apiKey = process.env.TEXTREQUEST_API_KEY
  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID
  if (!apiKey || !accountId || !phone) return
  try {
    await fetch('https://api.textrequest.com/api/v3/Messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ accountId, to: phone, body: message })
    })
  } catch { /* non-fatal */ }
}

export async function POST(req: NextRequest) {
  try {
    const { load_id } = await req.json()
    if (!load_id) return NextResponse.json({ error: 'load_id required' }, { status: 400 })

    // Fetch the new load
    const { data: load } = await supabase
      .from('loads')
      .select('id, pu_city, pu_state, dl_city, dl_state, escort_type, rate, status')
      .eq('id', load_id)
      .single()

    if (!load || load.status !== 'open') return NextResponse.json({ skipped: true })

    // Geocode pickup
    const pickupCoords = await geocode(load.pu_city, load.pu_state)
    if (!pickupCoords) return NextResponse.json({ skipped: true, reason: 'geocode_failed' })

    // Find Pro/Fleet escorts with active matches that have a deadhead_destination set
    const { data: activeMatches } = await supabase
      .from('loads')
      .select('matched_escort_id, deadhead_destination_city, deadhead_destination_state')
      .not('matched_escort_id', 'is', null)
      .not('deadhead_destination_city', 'is', null)
      .not('deadhead_destination_state', 'is', null)
      .in('status', ['matched', 'pending_match'])

    if (!activeMatches?.length) return NextResponse.json({ notified: 0 })

    // Get unique escort IDs
    const escortIds = [...new Set(activeMatches.map((m) => m.matched_escort_id))]

    // Fetch Pro/Fleet profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone, membership, role')
      .in('id', escortIds)
      .or('membership.eq.pro,role.eq.fleet')

    if (!profiles?.length) return NextResponse.json({ notified: 0 })

    const proFleetIds = new Set(profiles.map((p) => p.id))

    // Match escorts within 150 miles
    let notified = 0
    const notifiedEscortIds: string[] = []

    for (const match of activeMatches) {
      if (!proFleetIds.has(match.matched_escort_id)) continue

      const destCoords = await geocode(match.deadhead_destination_city, match.deadhead_destination_state)
      if (!destCoords) continue

      const dist = haversineDistance(destCoords.lat, destCoords.lon, pickupCoords.lat, pickupCoords.lon)
      if (dist > 150) continue

      const profile = profiles.find((p) => p.id === match.matched_escort_id)
      if (!profile) continue

      const msg = `🚛 Deadhead opportunity near your drop zone: ${load.escort_type} needed. ${load.pu_city}, ${load.pu_state} → ${load.dl_city}, ${load.dl_state}. Rate: $${load.rate}. You have 5 minutes to claim: oversize-escort-hub.com/loads/${load.id}`

      // SMS
      if (profile.phone) await sendSMS(profile.phone, msg)

      // In-app notification
      await supabase.from('notifications').insert({
        user_id: match.matched_escort_id,
        message: msg,
        read: false,
        created_at: new Date().toISOString(),
      })

      notifiedEscortIds.push(match.matched_escort_id)
      notified++
    }

    // Set deadhead_notified_at on the load
    if (notified > 0) {
      await supabase
        .from('loads')
        .update({ deadhead_notified_at: new Date().toISOString() })
        .eq('id', load_id)
    }

    return NextResponse.json({ notified, escortIds: notifiedEscortIds })
  } catch (error) {
    console.error('Deadhead route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: save deadhead destination on a load record
export async function PATCH(req: NextRequest) {
  try {
    const { load_id, deadhead_destination_city, deadhead_destination_state } = await req.json()
    if (!load_id || !deadhead_destination_city || !deadhead_destination_state) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { error } = await supabase
      .from('loads')
      .update({ deadhead_destination_city, deadhead_destination_state })
      .eq('id', load_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
