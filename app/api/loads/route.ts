import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyProEscorts } from '@/lib/notify-pro'
import { notifyDeadhead } from '@/lib/deadhead'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { pickupCity, pickupState, destinationCity, destinationState,
            escortType, escort_count, boardType, loadType, rate, notes,
            dateNeeded, expiresAt, cert_types, pay_term, permitUrl } = body

    if (!pickupCity || !pickupState || !destinationCity || !destinationState || !escortType || !boardType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const permit_url =
      typeof permitUrl === 'string' && permitUrl.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/`)
        ? permitUrl.slice(0, 1000)
        : null

    const expires = boardType === 'bid'
    ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
    : expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('loads')
      .insert([{
        carrier_id: user.id,
        pu_city: pickupCity,
        pu_state: pickupState,
        dl_city: destinationCity,
        dl_state: destinationState,
        escort_type: escortType,
        escort_count: escort_count || 1,
        board_type: boardType,
        load_type: loadType || 'oversize',
        per_mile_rate: rate || 0,
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
