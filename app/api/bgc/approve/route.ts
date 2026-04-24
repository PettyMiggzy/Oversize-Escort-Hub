import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { cert_id } = await req.json()
    if (!cert_id) return NextResponse.json({ error: 'Missing cert_id' }, { status: 400 })

    // Fetch cert to find owner + type
    const { data: cert, error: cErr } = await supabase
      .from('certifications')
      .select('id, user_id, type, status')
      .eq('id', cert_id)
      .single()
    if (cErr || !cert) return NextResponse.json({ error: 'Certification not found' }, { status: 404 })

    // Mark cert approved
    const { error: upErr } = await supabase
      .from('certifications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', cert_id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    // If BGC, flip profile flags
    if (cert.type === 'bgc' && cert.user_id) {
      await supabase
        .from('profiles')
        .update({ bgc_verified: true, bgc_pending: false })
        .eq('id', cert.user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
