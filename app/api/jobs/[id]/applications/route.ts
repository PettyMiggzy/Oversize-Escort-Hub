import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { isAdminEmail } from '@/lib/supabase'
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/profile-columns'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The poster sees who applied (public profile fields only; phone and email come after acceptance, from /api/jobs/contact).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { user, error } = await requireAuth()
  if (error) return error
  if (!UUID.test(id)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  const svc = serviceClient()
  const { data: job } = await svc.from('job_posts').select('id, poster_id').eq('id', id).maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  const { data: me } = await svc.from('profiles').select('role').eq('id', user!.id).maybeSingle()
  if (job.poster_id !== user!.id && me?.role !== 'admin' && !isAdminEmail(user!.email ?? '')) return NextResponse.json({ error: 'Not your job' }, { status: 403 })

  const { data: apps } = await svc.from('job_applications').select('id, applicant_id, message, status, created_at').eq('job_id', id).order('created_at', { ascending: false }).limit(200)
  const list = (apps || []) as { id: string; applicant_id: string; message: string | null; status: string; created_at: string }[]
  const ids = list.map((a) => a.applicant_id)
  const { data: people } = ids.length ? await svc.from('profiles').select(PUBLIC_PROFILE_COLUMNS.join(',')).in('id', ids) : { data: [] }
  const byId = new Map(((people || []) as unknown as { id: string }[]).map((p) => [p.id, p]))
  return NextResponse.json({ applications: list.map((a) => ({ ...a, applicant: byId.get(a.applicant_id) || null })) })
}
