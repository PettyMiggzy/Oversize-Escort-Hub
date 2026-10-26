import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { runAfter } from '@/lib/alerts'
import { alertApplicantDecision } from '@/lib/jobs-alerts'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The poster accepts or declines an application; the applicant withdraws their own. An accepted application is never
// silently flipped back by the poster (they close the job instead), but the applicant may still withdraw.
export async function POST(req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params
  const { user, error } = await requireAuth()
  if (error) return error
  if (!UUID.test(appId)) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  let body: { action?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const action = String(body.action)
  if (!['accept', 'decline', 'withdraw'].includes(action)) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const svc = serviceClient()
  const { data: app } = await svc.from('job_applications').select('id, job_id, applicant_id, status').eq('id', appId).maybeSingle()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  const { data: job } = await svc.from('job_posts').select('id, poster_id, status').eq('id', app.job_id).maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  if (action === 'withdraw') {
    if (app.applicant_id !== user!.id) return NextResponse.json({ error: 'Not your application' }, { status: 403 })
    if (app.status === 'withdrawn') return NextResponse.json({ ok: true, status: 'withdrawn' })
    await svc.from('job_applications').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', appId)
    return NextResponse.json({ ok: true, status: 'withdrawn' })
  }

  if (job.poster_id !== user!.id) return NextResponse.json({ error: 'Not your job' }, { status: 403 })
  if (app.status === 'withdrawn') return NextResponse.json({ error: 'The applicant withdrew' }, { status: 409 })
  if (job.status === 'removed') return NextResponse.json({ error: 'This job was removed' }, { status: 409 })
  const status = action === 'accept' ? 'accepted' : 'declined'
  if (app.status === status) return NextResponse.json({ ok: true, status })
  if (app.status === 'accepted') return NextResponse.json({ error: 'You already accepted this person' }, { status: 409 })
  await svc.from('job_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId)
  runAfter(() => alertApplicantDecision(app.job_id, app.applicant_id, status === 'accepted'))
  return NextResponse.json({ ok: true, status })
}
