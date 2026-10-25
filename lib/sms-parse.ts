// Shared text-to-post parser. Inbound SMS (Twilio) is the only caller.
// Format: OEH [board] [city...] [ST] [city...] [ST] [M/D] [position] [rate]
// The OEH prefix is optional.

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
])

export const MAX_POSITIONS = 6
export const MAX_RATE = 50

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
}

function normalizePosition(raw: string): string {
  const k = raw.toLowerCase().replace(/[^a-z]/g, '')
  const map: Record<string, string> = {
    lead: 'Lead',
    chase: 'Chase',
    rear: 'Rear',
    hp: 'High Pole',
    highpole: 'High Pole',
    rearsteer: 'Rear Steer',
  }
  return map[k] || titleCase(raw)
}

function normalizeBoard(raw: string): string | null {
  const k = raw.toLowerCase()
  if (k === 'flat') return 'flat-rate'
  if (k === 'bid') return 'bid'
  if (k === 'open') return 'open-bid'
  return null
}

// Parse M/D or M/D/YY or M/D/YYYY. A date with no year that is already past rolls to next year.
function parseDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2}|\d{4}))?$/)
  if (!m) return null
  const mo = parseInt(m[1], 10)
  const da = parseInt(m[2], 10)
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null
  const now = new Date()
  let yr: number
  if (m[3]) {
    yr = parseInt(m[3], 10)
    if (yr < 100) yr += 2000
  } else {
    yr = now.getFullYear()
    const candidate = new Date(yr, mo - 1, da)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (candidate < today) yr += 1
  }
  const mm = String(mo).padStart(2, '0')
  const dd = String(da).padStart(2, '0')
  return `${yr}-${mm}-${dd}`
}

export type ParsedSmsLoad = {
  boardType: string
  puCity: string
  puState: string
  dlCity: string
  dlState: string
  startDate: string
  positions: string[]
  perMileRate: number
}

export function parseSms(text: string): { ok: true; data: ParsedSmsLoad } | { ok: false; error: string } {
  const rawTokens = text.replace(/,/g, ' ').replace(/\.(?!\d)/g, ' ').replace(/\s+/g, ' ').trim().split(' ')
  const tokens = rawTokens[0]?.toUpperCase() === 'OEH' ? rawTokens.slice(1) : rawTokens
  // Minimum: board, puCity, puState, dlCity, dlState, M/D, position, rate.
  if (tokens.length < 8) return { ok: false, error: 'too_few_tokens' }

  const board = normalizeBoard(tokens[0])
  if (!board) return { ok: false, error: 'bad_board' }

  let puStateIdx = -1
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i].toUpperCase()
    if (t.length === 2 && US_STATES.has(t)) { puStateIdx = i; break }
  }
  if (puStateIdx < 2) return { ok: false, error: 'missing_pu_state' }

  let dlStateIdx = -1
  for (let i = puStateIdx + 2; i < tokens.length; i++) {
    const t = tokens[i].toUpperCase()
    if (t.length === 2 && US_STATES.has(t)) { dlStateIdx = i; break }
  }
  if (dlStateIdx < puStateIdx + 2) return { ok: false, error: 'missing_dl_state' }

  const puCity = titleCase(tokens.slice(1, puStateIdx).join(' '))
  const puState = tokens[puStateIdx].toUpperCase()
  const dlCity = titleCase(tokens.slice(puStateIdx + 1, dlStateIdx).join(' '))
  const dlState = tokens[dlStateIdx].toUpperCase()

  const rest = tokens.slice(dlStateIdx + 1)
  if (rest.length < 3) return { ok: false, error: 'missing_date_pos_rate' }

  const startDate = parseDate(rest[0])
  if (!startDate) return { ok: false, error: 'bad_date' }

  const posTokens = rest.slice(1, rest.length - 1)
  if (posTokens.length === 0) return { ok: false, error: 'missing_position' }
  const positions: string[] = Array.from(new Set(posTokens.map(normalizePosition).filter((x) => x.length > 0)))
  if (positions.length === 0) return { ok: false, error: 'bad_position' }
  if (positions.length > MAX_POSITIONS) return { ok: false, error: 'too_many_positions' }

  const rateToken = rest[rest.length - 1].replace(/[^0-9.]/g, '')
  const perMileRate = parseFloat(rateToken)
  if (!isFinite(perMileRate) || perMileRate <= 0 || perMileRate > MAX_RATE) return { ok: false, error: 'bad_rate' }

  return {
    ok: true,
    data: { boardType: board, puCity, puState, dlCity, dlState, startDate, positions, perMileRate },
  }
}

// Formats a profile phone may be stored as. The raw inbound value is included so an exact E.164 match hits.
export function phoneCandidates(raw: string): string[] {
  const trimmed = (raw || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  const ten = digits.length >= 10 ? digits.slice(-10) : ''
  const list: string[] = []
  const add = (v: string) => {
    if (v && !list.includes(v)) list.push(v)
  }
  add(trimmed)
  if (!ten) return list
  add(`+1${ten}`)
  add(`1${ten}`)
  add(ten)
  add(`(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`)
  add(`${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`)
  add(`${ten.slice(0, 3)}.${ten.slice(3, 6)}.${ten.slice(6)}`)
  return list
}
