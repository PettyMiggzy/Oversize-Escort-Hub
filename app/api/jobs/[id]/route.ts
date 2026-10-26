import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { isAdminEmail } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ACTIONS: Record<string, string> = { close: 'closed', filled: 'filled', remove: 'removed', reopen: 'open' }

// The poster (or an admin) closes, fills, removes or reopens a job.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { user, error } = await requireAuth()
  if (error) return error
  if (!UUID.test(id)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  let body: { action?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const status = ACTIONS[String(body.action)]
  if (!status) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const svc = serviceClient()
  const { data: job } = await svc.from('job_posts').select('id, poster_id, status, expires_at').eq('id', id).maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  const { data: me } = await svc.from('profiles').select('role').eq('id', user!.id).maybeSingle()
  const isAdmin = me?.role === 'admin' || isAdminEmail(user!.email ?? '')
  if (job.poster_id !== user!.id && !isAdmin) return NextResponse.json({ error: 'Not your job' }, { status: 403 })
  if (job.status === 'removed' && !isAdmin) return NextResponse.json({ error: 'This job was removed' }, { status: 403 })
  if (status === 'open' && job.status === 'removed') return NextResponse.json({ error: 'A removed job cannot be reopened' }, { status: 409 })
  const patch: Record<string, unknown> = { status }
  if (status === 'open') patch.expires_at = new Date(Date.now() + 30 * 86400000).toISOString()
  await svc.from('job_posts').update(patch).eq('id', id)
  return NextResponse.json({ ok: true, status })
}
