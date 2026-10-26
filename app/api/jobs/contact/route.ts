import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// After the poster accepts an application, each side may read the other's phone and email, and only then.
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const appId = req.nextUrl.searchParams.get('applicationId') || ''
  if (!UUID.test(appId)) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  const svc = serviceClient()
  const { data: app } = await svc.from('job_applications').select('id, job_id, applicant_id, status').eq('id', appId).maybeSingle()
  if (!app || app.status !== 'accepted') return NextResponse.json({ error: 'Contact details are shared after the company accepts' }, { status: 403 })
  const { data: job } = await svc.from('job_posts').select('poster_id').eq('id', app.job_id).maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  let otherId: string
  if (user!.id === job.poster_id) otherId = app.applicant_id
  else if (user!.id === app.applicant_id) otherId = job.poster_id
  else return NextResponse.json({ error: 'Not your application' }, { status: 403 })
  const { data: other } = await svc.from('profiles').select('full_name, phone, email').eq('id', otherId).maybeSingle()
  if (!other) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ name: other.full_name, phone: other.phone, email: other.email })
}
