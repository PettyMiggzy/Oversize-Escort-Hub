import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: check if fingerprint has already used trial
export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp');
  if (!fp) return NextResponse.json({ used: false });

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('device_fingerprints')
    .select('id')
    .eq('fingerprint', fp)
    .maybeSingle();

  if (error) {
    console.error('check-trial GET error:', error);
    return NextResponse.json({ used: false });
  }
  return NextResponse.json({ used: !!data });
}

// POST: record fingerprint after successful free trial signup
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { fp } = body;
  if (!fp || typeof fp !== 'string') return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = serviceClient();
  const { error } = await supabase
    .from('device_fingerprints')
    .insert({ fingerprint: fp });

  if (error) {
    console.error('check-trial POST error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
