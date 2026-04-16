import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { load_id } = await request.json();

    // Update load status to pending_match
    const { error: updateError } = await supabase
      .from('loads')
      .update({ status: 'pending_match', matched_escort_id: user.id })
      .eq('id', load_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { load_id, action } = await request.json();

    if (action === 'accept') {
      await supabase.from('loads').update({ status: 'matched' }).eq('id', load_id);
    } else if (action === 'decline') {
      await supabase.from('loads').update({ status: 'open', matched_escort_id: null }).eq('id', load_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
