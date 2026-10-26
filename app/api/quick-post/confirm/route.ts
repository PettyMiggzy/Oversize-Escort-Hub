import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { runAfter, alertEscortsNewLoad } from '@/lib/alerts'
import { notifyProEscorts } from '@/lib/notify-pro'
import { notifyDeadhead } from '@/lib/deadhead'
import { LIMITS, SITE, hashToken, ilikeExact, type QuickPostInput } from '@/lib/quick-post'
import { sendEmail } from '@/lib/email'
import { ADMIN_EMAILS } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Step 2: the emailed link was used. Post the load under the carrier's account (made now if they have none).
export async function POST(req: NextRequest) {
  let t = ''
  try { t = String((await req.json()).t || '') } catch { /* fall through */ }
  if (t.length < 32 || t.length > 200) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 })

  const svc = serviceClient()
  const hash = hashToken(t)
  const oldest = new Date(Date.now() - LIMITS.draftHours * 3600000).toISOString()
  const { data: draft } = await svc.from('quick_post_drafts').select('id, email, payload, used_at, created_at').eq('token_hash', hash).maybeSingle()
  if (!draft || draft.used_at || String(draft.created_at) < oldest) {
    return NextResponse.json({ error: 'This link has already been used or has expired. Post your load again.' }, { status: 410 })
  }
  // Claim the draft first so a double click cannot post twice
  const { data: claimed } = await svc.from('quick_post_drafts').update({ used_at: new Date().toISOString() }).eq('id', draft.id).is('used_at', null).select('id')
  if (!claimed || claimed.length !== 1) return NextResponse.json({ error: 'This link has already been used.' }, { status: 410 })

  const email = String(draft.email).toLowerCase()
  const p = draft.payload as Omit<QuickPostInput, 'email'>

  // Existing account for this email?
  const { data: found } = await svc.from('profiles').select('id, role, suspended, created_at').ilike('email', ilikeExact(email)).limit(1)
  let userId: string
  let created = false
  let accountAgeDays = 0
  if (found && found.length > 0) {
    const row = found[0] as { id: string; role: string | null; suspended: boolean | null; created_at: string | null }
    if (row.suspended) return NextResponse.json({ error: 'This account cannot post loads.' }, { status: 403 })
    if (!['carrier', 'broker', 'admin'].includes(row.role ?? '')) {
      return NextResponse.json({ error: 'This email belongs to an escort account. Sign in to use it, or post with a carrier email.' }, { status: 409 })
    }
    userId = row.id
    accountAgeDays = row.created_at ? (Date.now() - new Date(String(row.created_at)).getTime()) / 86400000 : 999
  } else {
    const { data: made, error: mkErr } = await svc.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: 'carrier', full_name: p.name, company_name: p.company || null },
    })
    if (mkErr || !made?.user) return NextResponse.json({ error: 'We could not set up your account. Try signing in instead.' }, { status: 409 })
    userId = made.user.id
    created = true
  }
  // Only an account this very link just created may later pick a password from it; for an existing account block that now
  await svc.from('quick_post_drafts').update({ user_id: userId, password_set_at: created ? null : new Date().toISOString() }).eq('id', draft.id)
  // Contact details live on the account, never on the load
  const patch: Record<string, unknown> = {}
  if (p.phone) patch.phone = p.phone
  if (created) { patch.full_name = p.name; patch.company_name = p.company || null }
  if (Object.keys(patch).length) await svc.from('profiles').update(patch).eq('id', userId)

  // A brand new account can hold 5 open loads for its first week; an established account has no cap
  if (accountAgeDays < LIMITS.newAccountDays) {
    const { data: open } = await svc.from('loads').select('id').eq('carrier_id', userId).eq('status', 'open').limit(LIMITS.openLoadsNewAccount + 1)
    if ((open?.length ?? 0) >= LIMITS.openLoadsNewAccount) {
      return NextResponse.json({ error: `New accounts can have ${LIMITS.openLoadsNewAccount} open loads in the first week. Sign in to manage them.` }, { status: 429 })
    }
  }

  const { data: load, error } = await svc.from('loads').insert({
    carrier_id: userId,
    pu_city: p.pickupCity, pu_state: p.pickupState,
    dl_city: p.destinationCity, dl_state: p.destinationState,
    escort_type: p.escortType, position: p.escortType,
    escort_count: p.escortCount,
    board_type: p.boardType,
    load_type: 'oversize',
    per_mile_rate: p.rate,
    notes: p.notes || '',
    start_date: p.dateNeeded,
    expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    poster_company: p.company || null,
    pay_term: 'on_completion',
    status: 'open',
    source: 'quick_post',
  }).select('id').single()
  if (error || !load?.id) return NextResponse.json({ error: 'Could not post the load. Please try again.' }, { status: 500 })

  const loadId = load.id as string
  runAfter(async () => {
    // Tell the admins so a bad post is seen within minutes (at most 10 of these emails a day)
    try {
      const since = new Date(Date.now() - 86400000).toISOString()
      const { data: today } = await svc.from('loads').select('id').eq('source', 'quick_post').gte('created_at', since).limit(11)
      if ((today?.length ?? 0) <= 10) {
        await Promise.allSettled(ADMIN_EMAILS.map((to) => sendEmail({
          to,
          subject: `Account-free load: ${p.pickupCity}, ${p.pickupState} to ${p.destinationCity}, ${p.destinationState}`,
          html: `<p style="font-family:Arial,sans-serif">A load was just posted without an account (${created ? 'brand new account' : 'existing account'}).<br>${p.escortCount} x ${p.escortType} at $${p.rate}/mi from ${email}.<br><a href="${SITE}/admin">Open the admin panel &gt; Quick posts to check or remove it</a>.</p>`,
        })))
      }
    } catch { /* best effort */ }
    await Promise.allSettled([
      notifyDeadhead(loadId),
      notifyProEscorts({ load_id: loadId, pu_state: p.pickupState, dl_state: p.destinationState }),
      alertEscortsNewLoad(loadId),
    ])
  })
  return NextResponse.json({ ok: true, loadId, newAccount: created, email })
}
