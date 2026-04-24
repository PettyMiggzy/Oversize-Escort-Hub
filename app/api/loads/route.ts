import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { pickupCity, pickupState, destinationCity, destinationState,
            escortType, escort_count, boardType, loadType, rate, notes,
            dateNeeded, expiresAt, cert_types, pay_term } = body

    if (!pickupCity || !pickupState || !destinationCity || !destinationState || !escortType || !boardType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
        permit_url: null,
        status: 'open',
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (data?.id) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/deadhead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: data.id }),
      }).catch(() => {})
      fetch(`${baseUrl}/api/loads/notify-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: data.id, pu_state: pickupState, dl_state: destinationState }),
      }).catch(() => {})
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error creating load:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
