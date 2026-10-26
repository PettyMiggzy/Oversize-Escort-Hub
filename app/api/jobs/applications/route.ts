import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

// The signed-in applicant's own applications, with the job's title, company and status. Nobody else's.
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error
  const svc = serviceClient()
  const { data: apps } = await svc.from('job_applications').select('id, job_id, status, message, created_at').eq('applicant_id', user!.id).order('created_at', { ascending: false }).limit(100)
  const list = (apps || []) as { id: string; job_id: string; status: string; message: string | null; created_at: string }[]
  const ids = [...new Set(list.map((a) => a.job_id))]
  const { data: jobs } = ids.length ? await svc.from('job_posts').select('id, title, company, status').in('id', ids) : { data: [] }
  const byId = new Map(((jobs || []) as { id: string; title: string; company: string | null; status: string }[]).map((j) => [j.id, j]))
  return NextResponse.json({ applications: list.map((a) => ({ ...a, job: byId.get(a.job_id) || null })) })
}
