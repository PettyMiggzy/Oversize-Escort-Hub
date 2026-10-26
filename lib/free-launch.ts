// Free launch: every PLAN feature is open to everyone while the marketplace fills up.
// Add-ons are never free: the BGC badge, P/EVO cert review and sponsored zones are one-time purchases at all times.
// On by default. To start charging, set NEXT_PUBLIC_FREE_LAUNCH=false in Vercel and redeploy; nothing else changes.
// (Plan rules, prices, checkout and the paywalls all stay in the code and switch back on with that one setting.)
export const FREE_LAUNCH = process.env.NEXT_PUBLIC_FREE_LAUNCH !== 'false'

const FLEET_TIERS = ['fleet_starter', 'fleet_plus', 'fleet_pro']

// The plan to treat an account as having. Escorts get Pro, carriers the carrier plan, fleet managers the top fleet plan.
// Admins, brokers and anyone else keep what their profile says.
export function effectiveTier(tier: string | null | undefined, role: string | null | undefined): string | null {
  if (!FREE_LAUNCH) return tier ?? null
  if (role === 'carrier') return 'carrier_member'
  if (role === 'fleet_manager') return tier && FLEET_TIERS.includes(tier) ? tier : 'fleet_pro'
  if (role === 'escort') return tier && FLEET_TIERS.includes(tier) ? tier : 'pro'
  return tier ?? null
}

// A profile row with its plan replaced by the effective one (for pages that read profile.tier directly).
export function withFreeLaunch<T extends { tier?: string | null; role?: string | null }>(p: T): T {
  if (!FREE_LAUNCH || !p) return p
  return { ...p, tier: effectiveTier(p.tier, p.role) }
}
