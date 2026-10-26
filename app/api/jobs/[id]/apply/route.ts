import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { runAfter } from '@/lib/alerts'
import { LIMITS } from '@/lib/jobs'
import { alertPosterNewApplicant } from '@/lib/jobs-alerts'
import { hasContactInfo } from '@/lib/quick-post'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// A signed-in account applies. Free for everyone. The message may not hold contact details: those are shared after acceptance.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { user, error } = await requireAuth()
  if (error) return error
  if (!UUID.test(id)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  let body: { message?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const message = typeof body.message === 'string' ? body.message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, ' ').trim().slice(0, 1000) : ''
  if (hasContactInfo(message)) return NextResponse.json({ error: 'Please take links, emails and phone numbers out of your message. They are shared once the company accepts you.' }, { status: 400 })

  const svc = serviceClient()
  const { data: me } = await svc.from('profiles').select('id, suspended').eq('id', user!.id).maybeSingle()
  if (!me || me.suspended) return NextResponse.json({ error: 'This account cannot apply' }, { status: 403 })
  const { data: job } = await svc.from('job_posts').select('id, poster_id, status, expires_at').eq('id', id).maybeSingle()
  if (!job || job.status !== 'open' || (job.expires_at && Date.parse(job.expires_at) < Date.now())) return NextResponse.json({ error: 'This job is no longer open' }, { status: 404 })
  if (job.poster_id === user!.id) return NextResponse.json({ error: 'You cannot apply to your own job' }, { status: 400 })

  const { data: mine } = await svc.from('job_applications').select('id, job_id, created_at').eq('applicant_id', user!.id).limit(200)
  const rows = (mine || []) as { job_id: string; created_at: string }[]
  if (rows.some((r) => r.job_id === id)) return NextResponse.json({ error: 'You already applied to this job' }, { status: 409 })
  if (rows.filter((r) => Date.parse(r.created_at) > Date.now() - 86400000).length >= LIMITS.applicationsPerDay) {
    return NextResponse.json({ error: 'That is a lot of applications for one day. Try again tomorrow.' }, { status: 429 })
  }
  const { error: insErr } = await svc.from('job_applications').insert({ job_id: id, applicant_id: user!.id, message, status: 'new' })
  if (insErr) return NextResponse.json({ error: 'Could not send your application' }, { status: 500 })
  runAfter(() => alertPosterNewApplicant(id))
  return NextResponse.json({ ok: true })
}
