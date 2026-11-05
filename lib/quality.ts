// Tools that help carriers keep good pilot cars and help pilot cars show their rig. Nothing here checks anyone:
// the escort lists their own equipment, the carrier chooses what a load needs, and reviews come from people who worked together.

export const EQUIPMENT: { key: string; label: string; short: string }[] = [
  { key: 'light_bar', label: 'Amber light bar', short: 'Light bar' },
  { key: 'roof_sign', label: 'Roof-mounted OVERSIZE LOAD sign', short: 'Roof sign' },
  { key: 'height_pole', label: 'Height pole', short: 'Height pole' },
  { key: 'cb_radio', label: 'CB radio', short: 'CB' },
  { key: 'two_way', label: 'Two-way radio or hands-free phone', short: 'Two-way' },
  { key: 'flags', label: 'Flags', short: 'Flags' },
  { key: 'paddle', label: 'Stop/slow paddle', short: 'Paddle' },
  { key: 'extinguisher', label: 'Fire extinguisher', short: 'Extinguisher' },
  { key: 'first_aid', label: 'First aid kit', short: 'First aid' },
  { key: 'vest', label: 'High-visibility vest and hard hat', short: 'Hi-vis gear' },
  { key: 'cones', label: 'Cones or flares', short: 'Cones' },
  { key: 'rear_amber', label: 'Rear amber lights', short: 'Rear amber' },
]
export const EQUIPMENT_KEYS = EQUIPMENT.map((e) => e.key)
export const equipmentLabel = (key: string) => EQUIPMENT.find((e) => e.key === key)?.label ?? key
export const equipmentShort = (key: string) => EQUIPMENT.find((e) => e.key === key)?.short ?? key

/** Keeps only known equipment keys, once each (anything typed by hand or stored by mistake is dropped). */
export function cleanEquipment(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return [...new Set(v.filter((x): x is string => typeof x === 'string' && EQUIPMENT_KEYS.includes(x)))]
}

/** The equipment a load asks for that the escort has not listed. */
export function missingEquipment(required: unknown, have: unknown): string[] {
  const mine = new Set(cleanEquipment(have))
  return cleanEquipment(required).filter((k) => !mine.has(k))
}

/** Regulars-first windows a carrier can pick, in minutes. */
export const REGULARS_MINUTES = [5, 10, 15, 30, 60]
export const regularsMinutes = (v: unknown): number => { const n = Number(v); return REGULARS_MINUTES.includes(n) ? n : 0 }

/** "Regulars first" is still running when regulars_until is in the future. */
export function regularsOpen(regularsUntil: string | null | undefined, now = Date.now()): boolean {
  if (!regularsUntil) return false
  const t = Date.parse(regularsUntil)
  return Number.isFinite(t) && t > now
}
export function regularsLeftMinutes(regularsUntil: string | null | undefined, now = Date.now()): number {
  const t = Date.parse(regularsUntil || '')
  return Number.isFinite(t) ? Math.max(0, Math.ceil((t - now) / 60000)) : 0
}

/** Tags a person can add to a review, by who is being reviewed. */
export const REVIEW_TAGS: Record<'escort' | 'carrier', { key: string; label: string }[]> = {
  escort: [
    { key: 'on_time', label: 'On time' },
    { key: 'clean_rig', label: 'Clean rig' },
    { key: 'good_radio', label: 'Good radio' },
    { key: 'knew_route', label: 'Knew the route' },
    { key: 'communicates', label: 'Good communication' },
    { key: 'would_hire_again', label: 'Would hire again' },
  ],
  carrier: [
    { key: 'paid_on_time', label: 'Paid on time' },
    { key: 'paid_late', label: 'Paid late' },
    { key: 'clear_info', label: 'Clear load info' },
    { key: 'fair_rate', label: 'Fair rate' },
    { key: 'communicates', label: 'Good communication' },
    { key: 'would_work_again', label: 'Would work again' },
  ],
}
export const reviewTagLabel = (key: string) => [...REVIEW_TAGS.escort, ...REVIEW_TAGS.carrier].find((t) => t.key === key)?.label ?? key
export function cleanTags(v: unknown, revieweeRole: string): string[] {
  const list = REVIEW_TAGS[revieweeRole === 'escort' ? 'escort' : 'carrier'].map((t) => t.key)
  if (!Array.isArray(v)) return []
  return [...new Set(v.filter((x): x is string => typeof x === 'string' && list.includes(x)))].slice(0, 6)
}

/** Pay answers are asked as a Yes/No question, not shown as chips. */
export const PAY_TAGS = ['paid_on_time', 'paid_late']
export const MIN_PAY_ANSWERS = 3
export type PayRecord = { onTime: number; total: number }
/** Only shown once enough people have answered; one answer says nothing. */
export const payLine = (r: PayRecord | null | undefined) => (r && r.total >= MIN_PAY_ANSWERS ? `Paid on time ${r.onTime} of ${r.total} times (reported by pilot cars who worked for them)` : null)
