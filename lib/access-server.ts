import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getAccessLevel, secondsUntilClaimable, type AccessLevel } from '@/lib/board-access'
import { isAdminEmail } from '@/lib/supabase'

// Who may claim or bid, decided on the server (the boards' own delay and lock are only a courtesy in the browser).
export async function escortAccess(supabase: SupabaseClient, user: User): Promise<AccessLevel> {
  const { data: p } = await supabase.from('profiles').select('tier, role').eq('id', user.id).single()
  const isAdmin = p?.role === 'admin' || isAdminEmail(user.email ?? '')
  return getAccessLevel(p?.tier, isAdmin)
}

// null when the load can be claimed now, otherwise the message to refuse with.
export function claimRefusal(level: AccessLevel, loadCreatedAt: string | null | undefined): string | null {
  if (level === 'none') return 'Upgrade to Member or Pro to claim loads'
  if (level === 'delayed' && secondsUntilClaimable(loadCreatedAt) > 0) return 'Pro members see this load first: try again in a moment'
  return null
}
