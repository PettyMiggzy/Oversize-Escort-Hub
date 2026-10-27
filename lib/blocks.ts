import type { SupabaseClient } from '@supabase/supabase-js'

// Blocking works both ways: once either person blocks the other, neither sees the other's loads or profile,
// and neither can bid on, claim, accept, message or review the other. Everything here runs with the service key.
export async function blockedIds(svc: SupabaseClient, userId: string): Promise<{ iBlocked: string[]; blockedMe: string[] }> {
  const [a, b] = await Promise.all([
    svc.from('user_blocks').select('blocked_id').eq('blocker_id', userId).limit(1000),
    svc.from('user_blocks').select('blocker_id').eq('blocked_id', userId).limit(1000),
  ])
  return {
    iBlocked: ((a.data || []) as { blocked_id: string }[]).map((r) => String(r.blocked_id)),
    blockedMe: ((b.data || []) as { blocker_id: string }[]).map((r) => String(r.blocker_id)),
  }
}

export async function isBlockedEitherWay(svc: SupabaseClient, a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false
  const [x, y] = await Promise.all([
    svc.from('user_blocks').select('blocker_id').eq('blocker_id', a).eq('blocked_id', b).limit(1),
    svc.from('user_blocks').select('blocker_id').eq('blocker_id', b).eq('blocked_id', a).limit(1),
  ])
  return !!((x.data && x.data.length) || (y.data && y.data.length))
}
