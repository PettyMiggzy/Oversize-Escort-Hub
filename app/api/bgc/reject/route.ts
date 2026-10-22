import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { user, error: authErr } = await requireAdmin()
    if (authErr) return authErr

    const { cert_id, reason } = await req.json()
    if (!cert_id) return NextResponse.json({ error: 'Missing cert_id' }, { status: 400 })

    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: cert } = await svc
      .from('certifications')
      .select('id, user_id, type')
      .eq('id', cert_id)
      .single()

    const { error: upErr } = await svc
      .from('certifications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id,
        reject_reason: reason || null,
      })
      .eq('id', cert_id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    if (cert?.type === 'bgc' && cert.user_id) {
      await svc
        .from('profiles')
        .update({ bgc_pending: false })
        .eq('id', cert.user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
