import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { checkTierAccess } from '@/lib/tier-access';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, rating, comment } = body;

    if (!targetUserId || typeof rating !== 'number') {
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
        reviewer_id: userId,
        target_user_id: targetUserId,
        rating,
        comment,
        created_at: new Date().toISOString(),
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
      .eq('target_user_id', userId);

    if (error) throw error;
    return NextResponse.json({ reviews: data });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
