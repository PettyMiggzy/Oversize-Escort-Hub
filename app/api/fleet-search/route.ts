export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/supabase'
import { effectiveTier } from '@/lib/free-launch'
import { requireAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit: 3 fleet searches per hour per Pro account
const HOURLY_LIMIT = 3
const DAILY_ADMIN_THRESHOLD = 20

export async function POST(req: NextRequest) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  try {
    const body = await req.json()
    const userId = user!.id
    const { escorts } = body as {
      escorts: Array<{ name: string; phone: string; city: string; state: string; available: boolean }>
    }
    if (!Array.isArray(escorts) || !escorts.length) {
      return NextResponse.json({ error: 'escorts required' }, { status: 400 })
    }
    if (escorts.length > 5) {
      return NextResponse.json({ error: 'Fleet Manager supports up to 5 escort slots' }, { status: 400 })
    }

    // Verify Pro membership
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, role')
      .eq('id', userId)
      .single()
    // Admin email bypass
    const userEmail = user!.email
    const fleetTiers = ['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro']
    if (!profile || (!fleetTiers.includes(effectiveTier(profile.tier, profile.role) ?? '') && !isAdminEmail(userEmail))) {
      return NextResponse.json({ error: 'Fleet Manager is a Pro/Fleet feature' }, { status: 403 })
    }

    // Rate limit check — 3 fleet searches per hour
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
    const { count: hourlyCount } = await supabase
      .from('fleet_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)
    if ((hourlyCount ?? 0) >= HOURLY_LIMIT) {
      return NextResponse.json({ error: 'Rate limit: 3 fleet searches per hour. Try again shortly.' }, { status: 429 })
    }

    // Log the search now, before the slow work, so parallel requests can't all slip under the hourly limit
    await supabase.from('fleet_searches').insert({
      user_id: userId,
      escort_count: escorts.length,
      created_at: new Date().toISOString(),
    })

    // Check daily count for admin flagging
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: dailyCount } = await supabase
      .from('fleet_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())

    // Geocode each escort location with Nominatim and find nearby loads
    const results = await Promise.all(
      escorts
        .filter((e) => e.available)
        .map(async (escort) => {
          try {
            const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(escort.city + ', ' + escort.state + ', USA')}&format=json&limit=1`
            const geoRes = await fetch(geoUrl, {
              headers: { 'User-Agent': 'OversizeEscortHub/1.0 (contact@oversizeescorthub.com)' },
            })
            const geoData = await geoRes.json()
            const lat = geoData[0]?.lat ? parseFloat(geoData[0].lat) : null
            const lon = geoData[0]?.lon ? parseFloat(geoData[0].lon) : null

            // Query loads within ~150 miles (roughly 2.5 degrees lat/lon)
            const { data: nearbyLoads } = await supabase
              .from('loads')
              .select('id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, status, board_type')
              .eq('status', 'open')
              .neq('status', 'filled')

            // Filter by proximity if we have coords (simplified: same state for now)
            const matchingLoads = (nearbyLoads ?? [])
              .filter((l) => l.pu_state?.toLowerCase() === escort.state?.toLowerCase())
              .slice(0, 10)

            return {
              escort: { name: escort.name, city: escort.city, state: escort.state },
              loads: matchingLoads,
              coords: { lat, lon },
            }
          } catch {
            return {
              escort: { name: escort.name, city: escort.city, state: escort.state },
              loads: [],
              coords: null,
            }
          }
        })
    )

    // Flag for admin if over daily threshold (dailyCount was read after this search was logged)
    const flagForAdmin = (dailyCount ?? 0) >= DAILY_ADMIN_THRESHOLD
    if (flagForAdmin) {
      await supabase.from('admin_flags').insert({
        user_id: userId,
        reason: `Fleet Manager: ${dailyCount ?? 0} searches today (threshold: ${DAILY_ADMIN_THRESHOLD})`,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ results, flagged: flagForAdmin })
  } catch (e: any) {
    console.error('[fleet-search]', e)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
