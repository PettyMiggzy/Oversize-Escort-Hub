import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { user, error: authErr } = await requireAdmin()
    if (authErr) return authErr

    const { cert_id } = await req.json()
    if (!cert_id) return NextResponse.json({ error: 'Missing cert_id' }, { status: 400 })

    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: cert, error: cErr } = await svc
      .from('certifications')
      .select('id, user_id, type, status')
      .eq('id', cert_id)
      .single()
    if (cErr || !cert) return NextResponse.json({ error: 'Certification not found' }, { status: 404 })

    const { error: upErr } = await svc
      .from('certifications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq('id', cert_id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    if (cert.type === 'bgc' && cert.user_id) {
      const { error: badgeErr } = await svc
        .from('profiles')
        .update({ bgc_verified: true, bgc_pending: false })
        .eq('id', cert.user_id)
      if (badgeErr) return NextResponse.json({ error: badgeErr.message }, { status: 500 })
    }

    const _ct = (cert.type || '').toString().toLowerCase()
    const _isPevo = cert.type === 'pevo' || cert.type === 'p_evo' || _ct.includes('pevo') || _ct.includes('p/evo')
    if (_isPevo && cert.user_id) {
      const { error: pevoErr } = await svc
        .from('profiles')
        .update({ pevo_verified: true })
        .eq('id', cert.user_id)
      if (pevoErr) return NextResponse.json({ error: pevoErr.message }, { status: 500 })
    }

    const _isVehicle = cert.type === 'vehicle' || _ct.includes('vehicle')
    if (_isVehicle && cert.user_id) {
      const { error: vehErr } = await svc
        .from('profiles')
        .update({ vehicle_verified: true })
        .eq('id', cert.user_id)
      if (vehErr) return NextResponse.json({ error: vehErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
