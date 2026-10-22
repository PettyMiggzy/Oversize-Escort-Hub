import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const { data, error } = await svc()
    .from('dd214_submissions')
    .select('*, profiles:user_id(full_name, email)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const body = await req.json().catch(() => ({}))
  const submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''
  const approved = Boolean(body.approved)
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  const client = svc()
  const { data: sub } = await client
    .from('dd214_submissions')
    .select('user_id, status')
    .eq('id', submissionId)
    .single()
  if (!sub?.user_id) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (sub.status !== 'pending') return NextResponse.json({ error: 'Already decided' }, { status: 409 })

  if (!approved) {
    await client.from('dd214_submissions').update({ status: 'rejected' }).eq('id', submissionId)
    await client.from('profiles').update({ dd214_pending: false }).eq('id', sub.user_id)
    return NextResponse.json({ ok: true })
  }

  const { data: done } = await client
    .from('dd214_submissions')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', submissionId)
    .eq('status', 'pending')
    .select('id')
  if (!done?.length) return NextResponse.json({ error: 'Already decided' }, { status: 409 })

  await client.from('veteran_discounts').insert({
    user_id: sub.user_id,
    discount_percentage: 30,
    created_at: new Date().toISOString(),
  })
  await client.from('profiles').update({ dd214_pending: false }).eq('id', sub.user_id)

  return NextResponse.json({ ok: true })
}
