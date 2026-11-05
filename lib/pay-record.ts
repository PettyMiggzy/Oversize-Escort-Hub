import { PAY_TAGS, type PayRecord } from '@/lib/quality'

/** Pay answers per poster, counted from reviews pilot cars left about them. Counts only; no names. */
export async function payRecords(client: any, userIds: string[]): Promise<Record<string, PayRecord>> {
  const ids = [...new Set(userIds.filter((x) => typeof x === 'string' && x))].slice(0, 100)
  const out: Record<string, PayRecord> = {}
  if (!ids.length) return out
  const { data } = await client.from('reviews').select('reviewee_id, tags').in('reviewee_id', ids).overlaps('tags', PAY_TAGS)
  for (const r of (data ?? []) as { reviewee_id: string; tags: string[] }[]) {
    const e = (out[r.reviewee_id] ||= { onTime: 0, total: 0 })
    e.total++
    if (r.tags.includes('paid_on_time')) e.onTime++
  }
  return out
}
