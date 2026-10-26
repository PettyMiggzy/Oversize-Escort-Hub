import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { sendEmail } from '@/lib/email'
import { LIMITS, SITE, clientIp, hashIp, ilikeExact, newToken, validateQuickPost } from '@/lib/quick-post'

export const dynamic = 'force-dynamic'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

// Step 1 of posting a load without an account: store a draft and email a one-time confirm link.
// The load is NOT posted here. It only goes live when the link is used (see /api/quick-post/confirm).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }

  // Bots fill the hidden field and submit in under three seconds
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ ok: true })
  const started = Number(body.startedAt)
  if (!Number.isFinite(started) || Date.now() - started < 3000) {
    return NextResponse.json({ error: 'That was fast. Please check the form and send it again.' }, { status: 400 })
  }

  const v = validateQuickPost(body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
  const { email, ...payload } = v.data

  const svc = serviceClient()
  const ip = hashIp(clientIp(req.headers))
  const since = (ms: number) => new Date(Date.now() - ms).toISOString()
  const count = async (col: 'ip_hash' | 'email', val: string, ms: number) => {
    const { data } = await svc.from('quick_post_drafts').select('id').eq(col, val).gte('created_at', since(ms)).limit(200)
    return data?.length ?? 0
  }
  const { data: all } = await svc.from('quick_post_drafts').select('id').gte('created_at', since(86400000)).limit(LIMITS.perDayAll + 1)
  if ((all?.length ?? 0) > LIMITS.perDayAll) return NextResponse.json({ error: 'We are getting a lot of posts right now. Please try again later.' }, { status: 429 })
  // Signed-up carriers and brokers post as much as they like (they could use the normal form anyway), so the hourly limit
  // only applies to an email that has no carrier or broker account
  const { data: acct } = await svc.from('profiles').select('id, role, suspended').ilike('email', ilikeExact(email)).limit(1)
  const a = (acct?.[0] ?? null) as { role: string | null; suspended: boolean | null } | null
  const signedUp = !!a && !a.suspended && ['carrier', 'broker', 'admin'].includes(a.role ?? '')
  if (!signedUp && (await count('email', email, 3600000) >= LIMITS.perEmailHour || await count('ip_hash', ip, 3600000) >= LIMITS.perIpHour)) {
    return NextResponse.json({ error: 'That is 3 posts this hour without an account. Please wait a bit, or sign up free to post as many as you need.' }, { status: 429 })
  }

  const { token, hash } = newToken()
  const { error } = await svc.from('quick_post_drafts').insert({ token_hash: hash, email, payload, ip_hash: ip })
  if (error) return NextResponse.json({ error: 'Could not save your post. Please try again.' }, { status: 500 })

  const link = `${SITE}/quick-post/confirm?t=${token}`
  const sent = await sendEmail({
    to: email,
    subject: 'Confirm your load on Oversize Escort Hub',
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
<h2 style="margin:0 0 12px">One click to post your load</h2>
<p style="font-size:15px;line-height:1.5">${esc(payload.pickupCity)}, ${esc(payload.pickupState)} &rarr; ${esc(payload.destinationCity)}, ${esc(payload.destinationState)}<br>
${esc(payload.escortCount)} &times; ${esc(payload.escortType)} &middot; $${esc(payload.rate)}/mi</p>
<p style="margin:20px 0"><a href="${link}" style="background:#ff6a13;color:#160800;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Confirm and post my load</a></p>
<p style="font-size:13px;color:#555">This link works once and expires in ${LIMITS.draftHours} hours. If you did not ask for this, ignore this email and nothing will be posted.</p></div>`,
  })
  if (!sent) return NextResponse.json({ error: 'We could not send the confirmation email. Check the address and try again.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
