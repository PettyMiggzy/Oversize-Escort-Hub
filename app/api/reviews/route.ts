import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { checkTierAccess } from '@/lib/tier-access';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loadId, targetUserId, rating, comment } = body;

    if (!loadId || !targetUserId || typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) {
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

    // the account's own (verified) email, not a profile column
    const email = user.email ?? '';
    const role = profile?.role;

    const hasAccess = await checkTierAccess(userId, email, 'member', role);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Upgrade to access reviews' }, { status: 403 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: 'You cannot review yourself' }, { status: 400 });
    }

    // only the two people on a load can review each other for it
    const { data: load } = await authed
      .from('loads')
      .select('carrier_id, matched_escort_id')
      .eq('id', loadId)
      .single();
    const pair = [load?.carrier_id, load?.matched_escort_id];
    if (!load || !pair.includes(userId) || !pair.includes(targetUserId)) {
      return NextResponse.json({ error: 'You can only review someone you worked a load with' }, { status: 403 });
    }

    const { data, error } = await authed
      .from('reviews')
      .insert({
        load_id: loadId,
        reviewer_id: userId,
        reviewee_id: targetUserId,
        rating,
        body: typeof comment === 'string' ? comment.slice(0, 2000) : null,
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
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId);

    if (error) throw error;
    return NextResponse.json({ reviews: data });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
