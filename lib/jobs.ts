// The jobs board: fleets and escort companies hiring subcontractors or drivers.
// OEH is the marketplace, not the employer: posters describe the work and the pay in their own words.
import { hasContactInfo } from '@/lib/quick-post'

export const CLASSIFICATIONS = ['1099', 'w2', 'either'] as const
export const EQUIPMENT = ['bring_own', 'company_vehicle', 'company_gear', 'either'] as const
export const PAY_MODELS = ['percent', 'weekly_flat', 'day_rate', 'per_mile', 'hourly', 'negotiable'] as const
export const SCHEDULES = ['full_time', 'part_time', 'on_call'] as const
export const TRAVEL = ['local', 'regional', 'nationwide'] as const

export const LIMITS = { openJobsPerAccount: 5, jobsPerDay: 10, applicationsPerDay: 20, activeDays: 30 }

// Plain-words labels, shared by the pages
export const LABELS = {
  classification: { '1099': 'Independent contractor (1099)', w2: 'Employee (W-2)', either: 'Contractor or employee' },
  equipment: { bring_own: 'You bring your own vehicle and gear', company_vehicle: 'Company provides the vehicle', company_gear: 'Company provides gear, you bring the vehicle', either: 'Either way works' },
  pay_model: { percent: 'Percent of the load', weekly_flat: 'Flat weekly pay', day_rate: 'Day rate', per_mile: 'Per mile', hourly: 'Hourly', negotiable: 'Negotiable' },
  schedule: { full_time: 'Full time', part_time: 'Part time', on_call: 'On call' },
  travel: { local: 'Local', regional: 'Regional', nationwide: 'Nationwide' },
} as const

// Sensible bounds per pay model (a typo like 2500 percent is refused)
const PAY_RANGE: Record<(typeof PAY_MODELS)[number], [number, number] | null> = {
  percent: [1, 100], weekly_flat: [100, 10000], day_rate: [50, 2000], per_mile: [0.5, 20], hourly: [8, 150], negotiable: null,
}

const STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO',
  'MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
])

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '')
const pick = <T extends readonly string[]>(list: T, v: unknown): T[number] | null => (list as readonly string[]).includes(String(v)) ? (String(v) as T[number]) : null

export type JobInput = {
  title: string; company: string; description: string
  classification: (typeof CLASSIFICATIONS)[number]; equipment: (typeof EQUIPMENT)[number]
  pay_model: (typeof PAY_MODELS)[number]; pay_min: number | null; pay_max: number | null; pay_note: string
  schedule: (typeof SCHEDULES)[number]; travel: (typeof TRAVEL)[number]
  base_city: string; base_state: string; states: string[]; cert_types: string[]; start_date: string | null
}

export function validateJob(body: unknown): { ok: true; data: JobInput } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const title = clean(b.title, 120)
  if (title.length < 5) return { ok: false, error: 'Give the job a short title, like "Lead escort, Texas, own truck".' }
  const description = typeof b.description === 'string' ? b.description.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, ' ').trim().slice(0, 3000) : ''
  const company = clean(b.company, 120)
  const pay_note = clean(b.pay_note, 200)
  for (const [label, text] of [['title', title], ['description', description], ['pay note', pay_note], ['company', company]] as const) {
    if (hasContactInfo(text)) return { ok: false, error: `Please take links, emails and phone numbers out of the ${label}. Applicants reach you through the site, and contact details are shared after you accept them.` }
  }
  const classification = pick(CLASSIFICATIONS, b.classification)
  const equipment = pick(EQUIPMENT, b.equipment)
  const pay_model = pick(PAY_MODELS, b.pay_model)
  const schedule = pick(SCHEDULES, b.schedule)
  const travel = pick(TRAVEL, b.travel)
  if (!classification) return { ok: false, error: 'Say whether this is a 1099 contractor job, a W-2 job, or either.' }
  if (!equipment) return { ok: false, error: 'Say who provides the vehicle and gear.' }
  if (!pay_model) return { ok: false, error: 'Pick how the pay works.' }
  if (!schedule) return { ok: false, error: 'Pick full time, part time or on call.' }
  if (!travel) return { ok: false, error: 'Pick local, regional or nationwide.' }
  let pay_min: number | null = null, pay_max: number | null = null
  const range = PAY_RANGE[pay_model]
  if (range) {
    pay_min = Number(b.pay_min)
    pay_max = b.pay_max === undefined || b.pay_max === null || b.pay_max === '' ? pay_min : Number(b.pay_max)
    if (!Number.isFinite(pay_min) || !Number.isFinite(pay_max) || pay_min < range[0] || pay_max > range[1] || pay_max < pay_min) {
      return { ok: false, error: `Enter pay between ${range[0]} and ${range[1]} (low to high) for ${LABELS.pay_model[pay_model].toLowerCase()}.` }
    }
  }
  const base_state = clean(b.base_state, 2).toUpperCase()
  if (base_state && !STATES.has(base_state)) return { ok: false, error: 'Pick a real state or province.' }
  const base_city = clean(b.base_city, 80)
  const states = [...new Set((Array.isArray(b.states) ? b.states : []).map((s) => clean(s, 2).toUpperCase()).filter((s) => STATES.has(s)))].slice(0, 20)
  const cert_types = [...new Set((Array.isArray(b.cert_types) ? b.cert_types : []).map((s) => clean(s, 40)).filter(Boolean))].slice(0, 20)
  if (!base_state && states.length === 0) return { ok: false, error: 'Say where the work is: a home state or the states you cover.' }
  let start_date: string | null = null
  if (typeof b.start_date === 'string' && b.start_date) {
    const t = Date.parse(b.start_date + 'T00:00:00Z')
    const today = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
    if (!Number.isFinite(t) || t < today || t - today > 365 * 86400000) return { ok: false, error: 'Pick a start date from today to a year out, or leave it empty.' }
    start_date = b.start_date.slice(0, 10)
  }
  return { ok: true, data: { title, company, description, classification, equipment, pay_model, pay_min, pay_max, pay_note, schedule, travel, base_city, base_state, states, cert_types, start_date } }
}

/** "$900 to $1,200 per week", "30% of the load", "Negotiable" */
export function payText(j: { pay_model: string; pay_min: number | null; pay_max: number | null }): string {
  const money = (n: number) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  const range = (fmt: (n: number) => string, suffix: string) => {
    if (j.pay_min == null) return 'Negotiable'
    return (j.pay_max == null || j.pay_max === j.pay_min ? fmt(j.pay_min) : `${fmt(j.pay_min)} to ${fmt(j.pay_max)}`) + suffix
  }
  switch (j.pay_model) {
    case 'percent': return range((n) => `${n}%`, ' of the load')
    case 'weekly_flat': return range(money, ' per week')
    case 'day_rate': return range(money, ' per day')
    case 'per_mile': return range(money, ' per mile')
    case 'hourly': return range(money, ' per hour')
    default: return 'Negotiable'
  }
}
