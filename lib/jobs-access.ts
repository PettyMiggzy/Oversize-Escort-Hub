// Who may post a job. For now it is free for everyone with an account. When the owner starts charging,
// set JOB_POSTING_FREE to false and posting needs a Pro or Fleet plan (applying stays free).
export const JOB_POSTING_FREE = true

const PAID_TIERS = ['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro']

export function canPostJobs(tier: string | null | undefined, role: string | null | undefined, isAdmin = false): boolean {
  if (isAdmin || role === 'admin') return true
  if (JOB_POSTING_FREE) return true
  return !!tier && PAID_TIERS.includes(tier)
}
