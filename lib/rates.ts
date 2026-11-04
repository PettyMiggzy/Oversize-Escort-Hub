import { isDemoLoad } from '@/lib/demo-loads'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TypicalRate = { state: string | null; count: number; median: number; low: number; high: number }

/** What loads open right now pay per mile, as the middle value and the range. Needs at least 3 loads, otherwise null. */
export async function typicalRates(svc: SupabaseClient, state?: string | null): Promise<TypicalRate | null> {
  const st = state && /^[A-Za-z]{2}$/.test(state) ? state.toUpperCase() : null
  let q = svc.from('loads').select('pu_state, per_mile_rate, expires_at, notes').eq('status', 'open').gt('per_mile_rate', 0).limit(2000)
  if (st) q = q.eq('pu_state', st)
  const { data } = await q
  const now = Date.now()
  const rates = ((data || []) as { per_mile_rate: number | string | null; expires_at?: string | null; notes?: string | null }[])
    .filter((r) => !isDemoLoad(r.notes))
    .filter((r) => !r.expires_at || Date.parse(r.expires_at) > now)
    .map((r) => Number(r.per_mile_rate))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 50)
    .sort((a, b) => a - b)
  if (rates.length < 3) return null
  const mid = Math.floor(rates.length / 2)
  const median = rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2
  const r2 = (n: number) => Math.round(n * 100) / 100
  return { state: st, count: rates.length, median: r2(median), low: r2(rates[0]), high: r2(rates[rates.length - 1]) }
}
