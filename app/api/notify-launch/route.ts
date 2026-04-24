import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Prefer service role for writes; fall back to anon so local/dev still works
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const source = String(body?.source || 'coming-soon').slice(0, 64);
    if (!email || !EMAIL_RE.test(email) || email.length > 320) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase
      .from('launch_waitlist')
      .upsert({ email, source }, { onConflict: 'email' });

    if (error) {
      // Duplicate is fine; anything else we log but don't leak internals.
      if (!/duplicate|conflict/i.test(error.message)) {
        console.error('[notify-launch] supabase error', error.message);
        return NextResponse.json({ ok: false, error: 'store_failed' }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[notify-launch] exception', e?.message);
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
}
