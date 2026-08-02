import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { checkTierAccess } from '@/lib/tier-access';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loadId, targetUserId, rating, comment } = body;

    if (!loadId || !targetUserId || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Derive identity from session, not body
    const authed = await createServerSupabase();
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const { data: profile } = await authed
      .from('profiles')
      .select('email, role')
      .eq('id', userId)
      .single();

    const email = profile?.email ?? user.email ?? '';
    const role = profile?.role;

    const hasAccess = await checkTierAccess(userId, email, 'member', role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Upgrade to access reviews' }, { status: 403 });
    }

    const { data, error } = await authed
      .from('reviews')
      .insert({
        load_id: loadId,
        reviewer_id: userId,
        reviewee_id: targetUserId,
        rating,
        body: comment ?? null,
      });

    if (error) throw error;
    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // With ?userId → that user's reviews; without → recent reviews (the
    // general /reviews page fetches with no param and 400'd before).
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (userId) query = query.eq('reviewee_id', userId);

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ reviews: data });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
