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

    const { cert_id, reason } = await req.json()
    if (!cert_id) return NextResponse.json({ error: 'Missing cert_id' }, { status: 400 })

    const { data: cert } = await supabase
      .from('certifications')
      .select('id, user_id, type')
      .eq('id', cert_id)
      .single()

    const { error: upErr } = await supabase
      .from('certifications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id, reject_reason: reason || null })
      .eq('id', cert_id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    // Clear pending flag on profile if it was a BGC
    if (cert?.type === 'bgc' && cert.user_id) {
      await supabase
        .from('profiles')
        .update({ bgc_pending: false })
        .eq('id', cert.user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
