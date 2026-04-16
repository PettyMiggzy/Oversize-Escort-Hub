import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pickupCity,
      pickupState,
      destinationCity,
      destinationState,
      escortType,
      rate,
      boardType,
    } = body;

    if (!pickupCity || !pickupState || !destinationCity || !destinationState || !escortType || !rate || !boardType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('loads')
      .insert([{
        carrier_id: user.id,
        pickup_city: pickupCity,
        pickup_state: pickupState,
        destination_city: destinationCity,
        destination_state: destinationState,
        escort_type: escortType,
        rate: parseFloat(rate),
        board_type: boardType,
        status: 'open',
        expires_at: expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating load:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
