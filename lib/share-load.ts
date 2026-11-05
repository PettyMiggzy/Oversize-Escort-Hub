import { serviceClient } from '@/lib/service-client'
import { isDemoLoad } from '@/lib/demo-loads'
import { estimatedTotal } from '@/lib/miles'
import { SITE_URL, loadLink, shareSummary, shareText } from '@/lib/share-text'

export { SITE_URL, loadLink, shareSummary, shareText }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ShareLoad = {
  id: string
  route: string
  position: string
  rate: string | null
  miles: number | null
  total: number | null
  date: string | null
  status: string
  expired: boolean
  urgent: boolean
  board: string
  needs: number
}

/** The public face of a load: where it goes, what it pays, when. Never a name, phone, email or note. Null for test loads and unknown ids. */
export async function getShareLoad(id: string): Promise<ShareLoad | null> {
  if (!UUID.test(id)) return null
  const { data } = await serviceClient().from('loads')
    .select('id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, miles, estimated_miles, start_date, escort_type, escort_count, status, expires_at, urgent, board_type, notes')
    .eq('id', id).maybeSingle()
  const l = data as any
  if (!l || isDemoLoad(l.notes)) return null
  const miles = Number(l.miles ?? l.estimated_miles ?? 0) || null
  const rateNum = Number(l.per_mile_rate)
  return {
    id: String(l.id),
    route: `${l.pu_city}, ${l.pu_state} to ${l.dl_city}, ${l.dl_state}`,
    position: String(l.escort_type || 'Escort'),
    rate: Number.isFinite(rateNum) && rateNum > 0 ? `$${rateNum.toFixed(2)}/mi` : null,
    miles,
    total: estimatedTotal(l.per_mile_rate, miles),
    date: l.start_date ? String(l.start_date) : null,
    status: String(l.status),
    expired: !!l.expires_at && Date.parse(l.expires_at) <= Date.now(),
    urgent: !!l.urgent,
    board: String(l.board_type || ''),
    needs: Number(l.escort_count || 1),
  }
}

export const isOpenToShare = (l: ShareLoad) => l.status === 'open' && !l.expired
