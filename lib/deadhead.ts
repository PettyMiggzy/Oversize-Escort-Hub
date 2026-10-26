import { createClient } from '@supabase/supabase-js'
import { FREE_LAUNCH } from '@/lib/free-launch'
import { sendSms } from '@/lib/twilio'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// Tells Pro and Fleet escorts who are about to finish a run near this new load. Called by the server when a
// load is posted (app/api/loads/route.ts), never from a browser.
export async function notifyDeadhead(load_id: string) {
  try {
    if (!load_id) return { error: 'load_id required' }

    const { data: load } = await supabase
      .from('loads')
      .select('id, pu_city, pu_state, dl_city, dl_state, escort_type, per_mile_rate, status, board_type, deadhead_notified_at')
      .eq('id', load_id)
      .single()

    if (!load || load.status !== 'open') return { skipped: true }
    if (load.deadhead_notified_at) return { skipped: true, reason: 'already_notified' }

    const pickupCoords = await geocode(load.pu_city, load.pu_state)
    if (!pickupCoords) return { skipped: true, reason: 'geocode_failed' }

    // Escorts with an active match that has a deadhead destination set
    const { data: activeMatches } = await supabase
      .from('loads')
      .select('matched_escort_id, deadhead_destination_city, deadhead_destination_state')
      .not('matched_escort_id', 'is', null)
      .not('deadhead_destination_city', 'is', null)
      .not('deadhead_destination_state', 'is', null)
      .in('status', ['filled', 'pending_match'])

    if (!activeMatches?.length) return { notified: 0 }

    const escortIds = [...new Set(activeMatches.map((m) => m.matched_escort_id))]

    // Pro and Fleet escorts (the plan is in profiles.tier)
    let profileQuery = supabase
      .from('profiles')
      .select('id, phone, tier, email, email_alerts, suspended')
      .in('id', escortIds)
    // while everything is free, every matched escort is on the instant plan
    if (!FREE_LAUNCH) profileQuery = profileQuery.in('tier', ['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro'])
    const { data: profiles } = await profileQuery

    if (!profiles?.length) return { notified: 0 }

    const proFleetIds = new Set(profiles.map((p) => p.id))
    const done = new Set<string>()
    let notified = 0

    for (const match of activeMatches) {
      if (!proFleetIds.has(match.matched_escort_id) || done.has(match.matched_escort_id)) continue

      const destCoords = await geocode(match.deadhead_destination_city, match.deadhead_destination_state)
      if (!destCoords) continue

      const dist = haversineDistance(destCoords.lat, destCoords.lon, pickupCoords.lat, pickupCoords.lon)
      if (dist > 150) continue

      const profile = profiles.find((p) => p.id === match.matched_escort_id)
      if (!profile) continue

      const rate = load.per_mile_rate ? `$${load.per_mile_rate}/mi` : 'see load'
      const msg = `🚛 Deadhead opportunity near your drop zone: ${load.escort_type} needed. ${load.pu_city}, ${load.pu_state} → ${load.dl_city}, ${load.dl_state}. Rate: ${rate}. You have 5 minutes to claim: oversize-escort-hub.com/loads/${load.id}`

      if (profile.phone) await sendSms(profile.phone, msg)
      // Texting is off for now, and five minutes is short: the same heads-up goes by email too (unless they turned alerts off)
      if (profile.email && profile.email_alerts !== false && !profile.suspended) {
        const link = `https://www.oversize-escort-hub.com/loads/${load.id}`
        await sendEmail({
          to: profile.email,
          subject: `Deadhead opportunity near your drop: ${load.pu_city}, ${load.pu_state}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111"><h2 style="margin:0 0 12px">Deadhead opportunity near your drop</h2><p style="font-size:15px;line-height:1.5">${load.escort_type} needed: ${load.pu_city}, ${load.pu_state} to ${load.dl_city}, ${load.dl_state}. Rate: ${rate}. You get a short head start before it opens to everyone.</p><p><a href="${link}" style="background:#ff6a13;color:#000;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Open the load</a></p></div>`,
        })
      }

      await supabase.from('notifications').insert({
        user_id: match.matched_escort_id,
        message: msg,
        read: false,
        created_at: new Date().toISOString(),
      })

      done.add(match.matched_escort_id)
      notified++
    }

    // The boards hide a load for 5 minutes after this stamp. A bid-board load closes after 5 minutes, so
    // stamping it would hide it for its whole life: those escorts are told, but the load is not held back.
    if (notified > 0 && load.board_type !== 'bid') {
      await supabase.from('loads').update({ deadhead_notified_at: new Date().toISOString() }).eq('id', load_id)
    }

    return { notified, escortIds: [...done] }
  } catch (error) {
    console.error('Deadhead error:', error)
    return { error: 'Internal server error' }
  }
}
