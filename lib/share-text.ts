// Pure helpers for the share card text, safe to use in the browser (no database here).
export const SITE_URL = 'https://www.oversize-escort-hub.com'
export const loadLink = (id: string) => `${SITE_URL}/l/${id}`

export type SharePieces = { route: string; position: string; rate: string | null; miles: number | null; total: number | null; date: string | null; urgent: boolean }

export function shareSummary(p: Pick<SharePieces, 'position' | 'rate' | 'miles' | 'total' | 'date'>): string {
  const bits = [p.position, p.rate, p.miles ? `about ${p.miles.toLocaleString('en-US')} mi` : null, p.total ? `about $${p.total.toLocaleString('en-US')} total` : null, p.date ? `needed ${p.date}` : null]
  return bits.filter(Boolean).join(' · ')
}

export function shareText(p: SharePieces): string {
  return `${p.urgent ? 'URGENT. ' : ''}Pilot car needed: ${p.route}. ${shareSummary(p)}. Free to claim or bid on Oversize Escort Hub.`
}

/** Builds the pieces from a load row as the boards and dashboards hold it. */
export function piecesFromRow(l: any): SharePieces {
  const miles = Number(l.miles ?? l.estimated_miles ?? 0) || null
  const r = Number(l.per_mile_rate)
  return {
    route: `${l.pu_city}, ${l.pu_state} to ${l.dl_city}, ${l.dl_state}`,
    position: String(l.escort_type || 'Escort'),
    rate: Number.isFinite(r) && r > 0 ? `$${r.toFixed(2)}/mi` : null,
    miles,
    total: miles && Number.isFinite(r) && r > 0 ? Math.round(r * miles) : null,
    date: l.start_date ? String(l.start_date) : null,
    urgent: !!l.urgent,
  }
}
