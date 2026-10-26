import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { isAdminEmail } from '@/lib/supabase'
import { runAfter } from '@/lib/alerts'
import { LIMITS, validateJob } from '@/lib/jobs'
import { canPostJobs } from '@/lib/jobs-access'
import { alertAdminsNewJob } from '@/lib/jobs-alerts'
import { refreshJobsBoard } from '@/lib/jobs-revalidate'

export const dynamic = 'force-dynamic'

// POST: a signed-in account posts a job. GET: the poster's own jobs with their applications.
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  let body: unknown = null
  try { body = await req.json() } catch { /* below */ }
  const v = validateJob(body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  const svc = serviceClient()
  const { data: me } = await svc.from('profiles').select('id, role, tier, suspended, full_name, company_name').eq('id', user!.id).maybeSingle()
  if (!me || me.suspended) return NextResponse.json({ error: 'This account cannot post jobs' }, { status: 403 })
  const isAdmin = me.role === 'admin' || isAdminEmail(user!.email ?? '')
  if (!canPostJobs(me.tier, me.role, isAdmin)) return NextResponse.json({ error: 'Posting a job needs a Pro membership', upgrade: true }, { status: 402 })

  if (!isAdmin) {
    const { data: mine } = await svc.from('job_posts').select('id, status, created_at').eq('poster_id', user!.id).limit(200)
    const rows = (mine || []) as { status: string; created_at: string }[]
    const dayAgo = Date.now() - 86400000
    if (rows.filter((r) => r.status === 'open').length >= LIMITS.openJobsPerAccount) {
      return NextResponse.json({ error: `You can have ${LIMITS.openJobsPerAccount} open jobs at a time. Close or fill one first.` }, { status: 429 })
    }
    if (rows.filter((r) => Date.parse(r.created_at) > dayAgo).length >= LIMITS.jobsPerDay) {
      return NextResponse.json({ error: 'That is a lot of jobs for one day. Try again tomorrow.' }, { status: 429 })
    }
  }

  const expires_at = new Date(Date.now() + LIMITS.activeDays * 86400000).toISOString()
  const company = v.data.company || me.company_name || me.full_name || ''
  const { data: job, error: insErr } = await svc.from('job_posts').insert({ ...v.data, company, poster_id: user!.id, status: 'open', expires_at }).select('id').single()
  if (insErr || !job) return NextResponse.json({ error: 'Could not post the job' }, { status: 500 })
  refreshJobsBoard(job.id)
  runAfter(() => alertAdminsNewJob(v.data.title, company))
  return NextResponse.json({ ok: true, id: job.id })
}

export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  const svc = serviceClient()
  const { data: jobs } = await svc.from('job_posts').select('*').eq('poster_id', user!.id).order('created_at', { ascending: false }).limit(50)
  const ids = (jobs || []).map((j: { id: string }) => j.id)
  const { data: apps } = ids.length ? await svc.from('job_applications').select('id, job_id, status').in('job_id', ids).limit(1000) : { data: [] }
  const counts: Record<string, { total: number; fresh: number }> = {}
  for (const a of (apps || []) as { job_id: string; status: string }[]) {
    const c = (counts[a.job_id] ||= { total: 0, fresh: 0 })
    c.total++
    if (a.status === 'new') c.fresh++
  }
  return NextResponse.json({ jobs: (jobs || []).map((j: { id: string }) => ({ ...j, applications: counts[j.id] || { total: 0, fresh: 0 } })) })
}
