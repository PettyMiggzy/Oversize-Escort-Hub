export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limit: 3 fleet searches per hour per Pro account
const HOURLY_LIMIT = 3
const DAILY_ADMIN_THRESHOLD = 20

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, escorts } = body as {
      userId: string
      escorts: Array<{ name: string; phone: string; city: string; state: string; available: boolean }>
    }
    if (!userId || !escorts?.length) {
      return NextResponse.json({ error: 'userId and escorts required' }, { status: 400 })
    }
    if (escorts.length > 5) {
      return NextResponse.json({ error: 'Fleet Manager supports up to 5 escort slots' }, { status: 400 })
    }

    // Verify Pro membership
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, role')
      .eq('id', userId)
      .single()
    // Admin email bypass
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
    const userEmail = authUser?.email
    if (!profile || (profile.subscription_tier !== 'pro' && !isAdminEmail(userEmail))) {
      return NextResponse.json({ error: 'Fleet Manager is a Pro-only feature' }, { status: 403 })
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
              .select('id, pickup_city, pickup_state, delivery_city, delivery_state, rate_per_mile, status, boards')
              .eq('status', 'open')
              .neq('status', 'filled')

            // Filter by proximity if we have coords (simplified: same state for now)
            const matchingLoads = (nearbyLoads ?? [])
              .filter((l) => l.pickup_state?.toLowerCase() === escort.state?.toLowerCase())
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

    // Log the fleet search
    await supabase.from('fleet_searches').insert({
      user_id: userId,
      escort_count: escorts.length,
      created_at: new Date().toISOString(),
    })

    // Flag for admin if over daily threshold
    const flagForAdmin = ((dailyCount ?? 0) + 1) >= DAILY_ADMIN_THRESHOLD
    if (flagForAdmin) {
      await supabase.from('admin_flags').insert({
        user_id: userId,
        reason: `Fleet Manager: ${(dailyCount ?? 0) + 1} searches today (threshold: ${DAILY_ADMIN_THRESHOLD})`,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ results, flagged: flagForAdmin })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
