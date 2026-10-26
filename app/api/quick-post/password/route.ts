import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { LIMITS, hashToken } from '@/lib/quick-post'

export const dynamic = 'force-dynamic'

// Optional step 3: a carrier whose account was just made by confirming a load picks a password,
// so they can sign in and see bids. Allowed once, only for the account that very link created, soon after.
export async function POST(req: NextRequest) {
  let t = '', password = ''
  try { const b = await req.json(); t = String(b.t || ''); password = String(b.password || '') } catch { /* below */ }
  if (t.length < 32 || t.length > 200) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 })
  if (password.length < 8 || password.length > 72) return NextResponse.json({ error: 'Use a password of 8 to 72 characters.' }, { status: 400 })

  const svc = serviceClient()
  const { data: d } = await svc.from('quick_post_drafts').select('id, user_id, email, used_at, password_set_at').eq('token_hash', hashToken(t)).maybeSingle()
  const recent = d?.used_at && Date.now() - new Date(String(d.used_at)).getTime() < LIMITS.passwordWindowMin * 60000
  if (!d || !d.user_id || !recent || d.password_set_at) return NextResponse.json({ error: 'You can no longer set a password from this link. Use "Forgot password" on the sign-in page.' }, { status: 410 })

  // Only an account that has never had a password (one made by this flow) can be set this way
  const { data: claimed } = await svc.from('quick_post_drafts').update({ password_set_at: new Date().toISOString() }).eq('id', d.id).is('password_set_at', null).select('id')
  if (!claimed || claimed.length !== 1) return NextResponse.json({ error: 'A password was already set.' }, { status: 410 })
  const { error } = await svc.auth.admin.updateUserById(String(d.user_id), { password })
  if (error) return NextResponse.json({ error: 'Could not set the password. Use "Forgot password" on the sign-in page.' }, { status: 500 })
  return NextResponse.json({ ok: true, email: d.email })
}
