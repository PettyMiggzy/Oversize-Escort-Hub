import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyProEscorts } from '@/lib/notify-pro'
import { notifyDeadhead } from '@/lib/deadhead'
import { isAdminEmail } from '@/lib/supabase'

const BOARD_TYPES = ['flat-rate', 'bid', 'open-bid']
const MAX_HOLD_MS = 14 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only carriers, brokers and admins post loads, and a suspended account cannot post
    const { data: poster } = await supabase.from('profiles').select('role, suspended').eq('id', user.id).maybeSingle()
    const isAdmin = poster?.role === 'admin' || isAdminEmail(user.email ?? '')
    if (poster?.suspended && !isAdmin) return NextResponse.json({ error: 'This account is suspended' }, { status: 403 })
    if (!isAdmin && poster?.role !== 'carrier' && poster?.role !== 'broker') {
      return NextResponse.json({ error: 'Only carriers and freight brokers can post loads' }, { status: 403 })
    }

    const body = await request.json()
    const { pickupCity, pickupState, destinationCity, destinationState,
            escortType, escort_count, boardType, loadType, rate, notes,
            dateNeeded, expiresAt, cert_types, pay_term, permitUrl } = body

    if (!pickupCity || !pickupState || !destinationCity || !destinationState || !escortType || !boardType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!BOARD_TYPES.includes(boardType)) {
      return NextResponse.json({ error: 'Unknown board type' }, { status: 400 })
    }
    const rateNum = rate === undefined || rate === null || rate === '' ? 0 : Number(rate)
    if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 50) {
      return NextResponse.json({ error: 'Invalid rate' }, { status: 400 })
    }
    // A permit link must be this carrier's own upload in the permits bucket
    let permit_url: string | null = null
    if (permitUrl) {
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/`
      const mine = typeof permitUrl === 'string'
        && (permitUrl.startsWith(`${base}public/permits/${user.id}/`) || permitUrl.startsWith(`${base}sign/permits/${user.id}/`))
      if (!mine) return NextResponse.json({ error: 'Invalid permit file' }, { status: 400 })
      permit_url = permitUrl.slice(0, 1000)
    }

    // A requested expiry must be in the future and no more than two weeks out; otherwise the usual 24 hours
    const asked = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN
    const expires = boardType === 'bid'
      ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
      : Number.isFinite(asked) && asked > Date.now() && asked - Date.now() <= MAX_HOLD_MS
        ? new Date(asked).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('loads')
      .insert([{
        carrier_id: user.id,
        pu_city: pickupCity,
        pu_state: pickupState,
        dl_city: destinationCity,
        dl_state: destinationState,
        escort_type: escortType,
        position: escortType,
        escort_count: escort_count || 1,
        board_type: boardType,
        load_type: loadType || 'oversize',
        per_mile_rate: rateNum,
        notes: notes || '',
        start_date: dateNeeded || null,
        expires_at: expires,
        cert_types: cert_types || [],
        pay_term: pay_term || 'on_completion',
        permit_url,
        status: 'open',
      }])
      .select()
      .single()

    if (error) {
      console.error('Error inserting load:', error)
      return NextResponse.json({ error: 'Could not post the load' }, { status: 500 })
    }

    // after() keeps the work running once the response is sent (a plain un-awaited fetch is frozen with the
    // serverless function, so Pro early-access alerts could silently never go out)
    if (data?.id) {
      const loadId = data.id as string
      after(async () => {
        await Promise.allSettled([
          notifyDeadhead(loadId),
          notifyProEscorts({ load_id: loadId, pu_state: pickupState, dl_state: destinationState }),
        ])
      })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error creating load:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
