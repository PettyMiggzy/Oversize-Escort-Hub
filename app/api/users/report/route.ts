import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'
import { sendEmail } from '@/lib/email'
import { ADMIN_EMAILS } from '@/lib/supabase'
import { runAfter } from '@/lib/alerts'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REASONS = ['harassment', 'scam', 'spam', 'fake', 'inappropriate', 'other'] as const

// A signed-in user reports another user (a profile, a poster, a reviewer). One report per pair; admins are emailed once.
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  let body: { userId?: string; reason?: string; details?: string } = {}
  try { body = await req.json() } catch { /* below */ }
  const userId = String(body.userId || '')
  const reason = REASONS.find((r) => r === body.reason)
  if (!UUID.test(userId) || !reason) return NextResponse.json({ error: 'Pick a reason' }, { status: 400 })
  if (userId === user!.id) return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 })
  const details = String(body.details || '').slice(0, 500) || null
  const svc = serviceClient()
  const { data: target } = await svc.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const { data: mine } = await svc.from('user_reports').select('id').eq('reporter_id', user!.id).eq('reported_id', userId).limit(1)
  if (mine && mine.length) return NextResponse.json({ ok: true, already: true })
  const { error: insErr } = await svc.from('user_reports').insert({ reporter_id: user!.id, reported_id: userId, reason, details })
  if (insErr) return NextResponse.json({ error: 'Could not send the report' }, { status: 500 })
  const { count } = await svc.from('user_reports').select('id', { count: 'exact', head: true }).eq('reported_id', userId)
  runAfter(async () => {
    await Promise.allSettled(ADMIN_EMAILS.map((to) => sendEmail({
      to,
      subject: `User reported (${count ?? 1}): ${reason}`,
      html: `<p style="font-family:Arial,sans-serif">A user was reported (${reason}). Total reports on this user: ${count ?? 1}.<br><a href="https://www.oversize-escort-hub.com/admin">Open the admin panel</a></p>`,
    })))
  })
  return NextResponse.json({ ok: true })
}
