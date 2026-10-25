import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getAccessLevel, secondsUntilClaimable, type AccessLevel } from '@/lib/board-access'
import { isAdminEmail } from '@/lib/supabase'
import { effectiveTier } from '@/lib/free-launch'

const DEADHEAD_EXCLUSIVE_MS = 5 * 60 * 1000

export type EscortClaimant =
  | { ok: true; level: AccessLevel }
  | { ok: false; error: string }

// Who may claim or bid, decided on the server (board UI delay/lock is only a courtesy).
export async function escortClaimant(supabase: SupabaseClient, user: User): Promise<EscortClaimant> {
  const { data: p } = await supabase.from('profiles').select('tier, role, suspended').eq('id', user.id).single()
  const isAdmin = p?.role === 'admin' || isAdminEmail(user.email ?? '')
  if (p?.suspended && !isAdmin) return { ok: false, error: 'This account is suspended' }
  // fleet_manager keeps escort claim/bid rights (fleet plans include Pro escort features)
  if (!isAdmin && p?.role !== 'escort' && p?.role !== 'fleet_manager') {
    return { ok: false, error: 'Only escorts can claim or bid on loads' }
  }
  return { ok: true, level: getAccessLevel(effectiveTier(p?.tier, p?.role), isAdmin) }
}

/** @deprecated prefer escortClaimant — kept for any stray callers */
export async function escortAccess(supabase: SupabaseClient, user: User): Promise<AccessLevel> {
  const result = await escortClaimant(supabase, user)
  return result.ok ? result.level : 'none'
}

// null when the load can be claimed now, otherwise the message to refuse with.
export function claimRefusal(
  level: AccessLevel,
  loadCreatedAt: string | null | undefined,
  deadheadNotifiedAt?: string | null,
): string | null {
  if (level === 'none') return 'Upgrade to Member or Pro to claim loads'
  // Deadhead exclusive window: only instant (Pro/Fleet) tiers during the 5 minutes after stamp
  if (deadheadNotifiedAt && level !== 'instant') {
    const stamped = Date.parse(deadheadNotifiedAt)
    if (!Number.isNaN(stamped) && Date.now() < stamped + DEADHEAD_EXCLUSIVE_MS) {
      return 'Pro and Fleet escorts have exclusive access to this deadhead load for a few more minutes'
    }
  }
  if (level === 'delayed' && secondsUntilClaimable(loadCreatedAt) > 0) {
    return 'Pro members see this load first: try again in a moment'
  }
  return null
}
