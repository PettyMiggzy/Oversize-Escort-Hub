import type { SupabaseClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/supabase'

// Wraith is a paid add-on: a few free questions a day to try it, then a monthly subscription (made on the website only, never inside the phone apps).
export const WRAITH_FREE_DAILY = 5
const GRACE_MS = 2 * 86400000 // renewals can reach us a little late

export const wraithPriceId = () => process.env.STRIPE_WRAITH_PRICE_ID || ''

type Row = { status?: string; current_period_end?: string | null; stripe_customer_id?: string | null }

/** True for a live subscription (or the owner's own admin account, for testing). */
export async function hasWraithAccess(svc: SupabaseClient, userId: string, email?: string | null): Promise<boolean> {
  if (isAdminEmail(email)) return true
  const { data } = await svc.from('wraith_access').select('status, current_period_end').eq('user_id', userId).maybeSingle()
  const r = data as Row | null
  if (!r || (r.status !== 'active' && r.status !== 'trialing')) return false
  return !r.current_period_end || Date.parse(r.current_period_end) > Date.now() - GRACE_MS
}

export async function wraithCustomerId(svc: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await svc.from('wraith_access').select('stripe_customer_id').eq('user_id', userId).maybeSingle()
  return ((data as Row | null)?.stripe_customer_id as string | null) ?? null
}

/** Create or update the subscription row for a person. Returns an error message when the write did not land. */
export async function setWraithAccess(svc: SupabaseClient, userId: string, patch: { status: string; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; current_period_end?: string | null }): Promise<string | null> {
  const row = { ...patch, updated_at: new Date().toISOString() }
  const { data: existing } = await svc.from('wraith_access').select('user_id').eq('user_id', userId).maybeSingle()
  const { error } = existing
    ? await svc.from('wraith_access').update(row).eq('user_id', userId)
    : await svc.from('wraith_access').insert({ user_id: userId, ...row })
  return error ? error.message || 'write failed' : null
}

/** A subscription that has ended or failed: only for the row that holds it. */
export async function endWraithAccess(svc: SupabaseClient, subscriptionId: string, status = 'canceled'): Promise<string | null> {
  const { data: rows } = await svc.from('wraith_access').select('user_id').eq('stripe_subscription_id', subscriptionId)
  for (const r of (rows || []) as { user_id: string }[]) {
    const { error } = await svc.from('wraith_access').update({ status, updated_at: new Date().toISOString() }).eq('user_id', r.user_id)
    if (error) return error.message || 'write failed'
  }
  return null
}

/** "$9.99 a month", read from Stripe so the page never disagrees with what is charged. */
export async function wraithPriceText(): Promise<string | null> {
  const id = wraithPriceId()
  if (!id || !process.env.STRIPE_SECRET_KEY) return null
  try {
    const Stripe = (await import('stripe')).default
    const p = await new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' }).prices.retrieve(id)
    if (p.unit_amount == null) return null
    const amt = (p.unit_amount / 100).toFixed(p.unit_amount % 100 ? 2 : 0)
    return `$${amt} a ${p.recurring?.interval === 'year' ? 'year' : 'month'}`
  } catch { return null }
}

/** Free questions left in the last 24 hours (counted from the shared usage log). */
export async function wraithFreeLeft(svc: SupabaseClient, userId: string): Promise<number> {
  const { count, data } = await svc.from('helper_usage').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()).eq('key', `u:${userId}`).eq('kind', 'wraith')
  const used = count ?? (Array.isArray(data) ? data.length : 0)
  return Math.max(0, WRAITH_FREE_DAILY - used)
}
