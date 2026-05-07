// Client-side tier access helpers for the load boards.
// Single source of truth for who can claim / bid and when.
//
// Tier values come from profiles.tier and may be:
//   'free' | 'trial' | 'member' | 'pro' | 'fleet_starter' | 'fleet_plus' | 'fleet_pro'
// Anything else (including null/undefined) is treated as 'free'.

export type AccessLevel = 'none' | 'delayed' | 'instant';

export const CLAIM_DELAY_SECONDS = 60;

const INSTANT_TIERS = new Set([
  'pro',
  'fleet_starter',
  'fleet_plus',
  'fleet_pro',
]);

// Mirrors lib/supabase.ts ADMIN_EMAILS but kept local so this module has no
// runtime dependency on supabase. Callers usually pass an already-resolved
// admin flag via getAccessLevel(tier, email) -> isAdminEmail(email) handled
// upstream when imported alongside isAdminEmail.
export function getAccessLevel(
  tier: string | null | undefined,
  isAdmin: boolean,
): AccessLevel {
  if (isAdmin) return 'instant';
  if (tier && INSTANT_TIERS.has(tier)) return 'instant';
  if (tier === 'member') return 'delayed';
  return 'none';
}

// Returns the number of whole seconds remaining until a load is claimable
// for a 'delayed' (member) viewer. Clamped to >= 0. If the input is invalid,
// returns 0 (i.e. immediately claimable) so we fail open rather than locking
// a user out forever on bad data.
export function secondsUntilClaimable(
  createdAt: string | null | undefined,
  nowMs: number = Date.now(),
  delaySeconds: number = CLAIM_DELAY_SECONDS,
): number {
  if (!createdAt) return 0;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return 0;
  const elapsed = Math.floor((nowMs - t) / 1000);
  const remaining = delaySeconds - elapsed;
  return remaining > 0 ? remaining : 0;
}
