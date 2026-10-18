import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

// Tables holding only this user's own working data: removed outright.
const OWN_DATA: Array<[table: string, column: string]> = [
  ['push_subscriptions', 'user_id'],
  ['notifications', 'user_id'],
  ['escort_availability', 'escort_id'],
  ['escort_expenses', 'escort_id'],
  ['job_logs', 'escort_id'],
  ['sponsored_zones', 'user_id'],
  ['fleet_searches', 'user_id'],
  ['fleet_escorts', 'user_id'],
  ['device_fingerprints', 'user_id'],
  ['veteran_discounts', 'user_id'],
  ['dd214_submissions', 'user_id'],
  ['certifications', 'user_id'],
]

// POST { confirm: "DELETE" }: deletes the signed-in user's account (the "Delete my account" page and the app stores'
// account-deletion rule). Order: stop billing, close what others could still act on, remove personal data, remove the login.
export async function POST(req: NextRequest) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  const userId = user!.id

  const body = await req.json().catch(() => ({}))
  if (body?.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 })
  }

  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // each cleanup is best effort: a table that is missing or locked must not stop the deletion (it is logged)
  const step = async (label: string, fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    try {
      const { error } = await fn()
      if (error) console.error(`[account delete] ${label}:`, error.message)
    } catch (e) {
      console.error(`[account delete] ${label}:`, e)
    }
  }

  const { data: profile } = await svc.from('profiles').select('stripe_subscription_id, stripe_customer_id').eq('id', userId).single()

  // 1. stop billing first: if this fails the account is NOT deleted, so no one is charged for an account they cannot reach
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch (e: any) {
      if (e?.code !== 'resource_missing') {
        console.error('[account delete] stripe cancel failed:', e)
        return NextResponse.json({ error: 'Could not cancel your subscription. Nothing was deleted: try again or email support.' }, { status: 502 })
      }
    }
  }

  // 2. close what other people could still act on
  await step('loads', () => svc.from('loads').update({ status: 'expired' }).eq('carrier_id', userId).in('status', ['open', 'pending_match']))
  await step('held loads', () => svc.from('loads').update({ status: 'open', matched_escort_id: null, match_requested_at: null }).eq('matched_escort_id', userId).eq('status', 'pending_match'))
  await step('bids', () => svc.from('bids').update({ status: 'rejected' }).eq('escort_id', userId).eq('status', 'pending'))

  // 3. remove personal data
  for (const [table, column] of OWN_DATA) {
    await step(table, () => svc.from(table).delete().eq(column, userId))
  }
  await step('referrals', () => svc.from('referrals').delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`))
  // identity fields first, on their own, so a missing optional column can never leave them behind
  await step('profile identity', () => svc.from('profiles').update({
    full_name: 'Deleted user',
    company_name: null,
    email: null,
    phone: null,
    push_token: null,
    avatar_url: null,
  }).eq('id', userId))
  await step('profile extras', () => svc.from('profiles').update({
    stripe_subscription_id: null,
    bgc_document_url: null,
    dd214_url: null,
    sms_opt_in: false,
    availability_states: [],
  }).eq('id', userId))

  // 4. remove the login. Records other people rely on (invoices, reviews, finished loads) stay, under "Deleted user".
  const { error: delErr } = await svc.auth.admin.deleteUser(userId)
  if (delErr) {
    // still tied to rows we must keep: lock the login for good instead, so the account is closed either way
    console.error('[account delete] deleteUser failed, banning instead:', delErr.message)
    const { error: banErr } = await svc.auth.admin.updateUserById(userId, { ban_duration: '876000h', email: `deleted+${userId}@oversize-escort-hub.invalid` })
    if (banErr) {
      console.error('[account delete] ban failed:', banErr.message)
      return NextResponse.json({ error: 'Your data was removed but the login could not be closed. Email support@oversize-escort-hub.com.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
