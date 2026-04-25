import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// verifySignature: true=valid, false=invalid, null=cannot verify (skip).
function verifySignature(body: string, signature: string | null): boolean | null {
  const secret = process.env.TEXTREQUEST_WEBHOOK_SECRET
  if (!secret) return null
  if (!signature) return null
  try {
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    return expected === signature
  } catch {
    return null
  }
}

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
])

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
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

// Parse M/D or M/D/YY or M/D/YYYY. If past, roll to next year.
function parseDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/)
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

type Parsed = {
  boardType: string
  puCity: string
  puState: string
  dlCity: string
  dlState: string
  startDate: string
  position: string
  perMileRate: number
}

// Format: OEH [board] [city...] [ST] [city...] [ST] [M/D] [position] [rate]
function parseSms(text: string): { ok: true; data: Parsed } | { ok: false; error: string } {
  const tokens = text.trim().split(/\s+/)
  if (tokens.length < 8) return { ok: false, error: 'too_few_tokens' }
  if (tokens[0].toUpperCase() !== 'OEH') return { ok: false, error: 'missing_oeh' }

  const board = normalizeBoard(tokens[1])
  if (!board) return { ok: false, error: 'bad_board' }

  // Find first 2-letter state token after board (index 2+)
  let puStateIdx = -1
  for (let i = 2; i < tokens.length; i++) {
    const t = tokens[i].toUpperCase()
    if (t.length === 2 && US_STATES.has(t)) { puStateIdx = i; break }
  }
  if (puStateIdx < 3) return { ok: false, error: 'missing_pu_state' }

  // Find second state after puStateIdx
  let dlStateIdx = -1
  for (let i = puStateIdx + 2; i < tokens.length; i++) {
    const t = tokens[i].toUpperCase()
    if (t.length === 2 && US_STATES.has(t)) { dlStateIdx = i; break }
  }
  if (dlStateIdx < puStateIdx + 2) return { ok: false, error: 'missing_dl_state' }

  const puCity = titleCase(tokens.slice(2, puStateIdx).join(' '))
  const puState = tokens[puStateIdx].toUpperCase()
  const dlCity = titleCase(tokens.slice(puStateIdx + 1, dlStateIdx).join(' '))
  const dlState = tokens[dlStateIdx].toUpperCase()

  const rest = tokens.slice(dlStateIdx + 1)
  if (rest.length < 3) return { ok: false, error: 'missing_date_pos_rate' }

  const startDate = parseDate(rest[0])
  if (!startDate) return { ok: false, error: 'bad_date' }

  const position = normalizePosition(rest[1])

  const rateToken = rest[rest.length - 1].replace(/[^0-9.]/g, '')
  const perMileRate = parseFloat(rateToken)
  if (!isFinite(perMileRate) || perMileRate <= 0) return { ok: false, error: 'bad_rate' }

  return {
    ok: true,
    data: { boardType: board, puCity, puState, dlCity, dlState, startDate, position, perMileRate },
  }
}

// Return last 10 digits of a phone string, or '' if fewer.
function last10(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : ''
}

async function lookupCarrierId(phoneRaw: string): Promise<string | null> {
  const ten = last10(phoneRaw)
  if (!ten) return null
  const candidates = [
    `+1${ten}`,
    `1${ten}`,
    ten,
    `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`,
    `${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`,
    `${ten.slice(0, 3)}.${ten.slice(3, 6)}.${ten.slice(6)}`,
  ]
  const orFilter = candidates.map(c => `phone.eq.${c}`).join(',')
  const { data, error } = await svc
    .from('profiles')
    .select('id')
    .or(orFilter)
    .limit(1)
  if (error) {
    console.error('SMS carrier lookup error:', JSON.stringify(error))
    return null
  }
  return data && data.length > 0 ? data[0].id : null
}

async function sendTextRequestReply(toPhone: string, body: string) {
  try {
    const apiKey = process.env.TEXTREQUEST_API_KEY
    const accountId = process.env.TEXTREQUEST_ACCOUNT_ID
    if (!apiKey || !accountId || !toPhone) return
    await fetch('https://api.textrequest.com/api/Messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify({
        AccountId: accountId,
        Contact: { PhoneNumber: toPhone },
        Body: body,
      }),
    })
  } catch (e) {
    console.error('SMS reply send failed:', e)
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('x-textrequest-signature')

  // Signature verification — only 401 when we CAN verify AND sig is wrong.
  const sigResult = verifySignature(rawBody, sig)
  if (sigResult === false) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let parsed: any
  try { parsed = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // TextRequest inbound payload: message + consumerPhoneNumber
  // Tolerate older/alt shapes too.
  const phone: string =
    parsed?.consumerPhoneNumber || parsed?.From || parsed?.from || ''
  const messageText: string = (
    parsed?.message || parsed?.Body || parsed?.body || ''
  ).toString()
  const upper = messageText.trim().toUpperCase()

  if (!phone) return NextResponse.json({ ok: true })

  // STOP / UNSUBSCRIBE
  if (upper === 'STOP' || upper === 'UNSUBSCRIBE') {
    await svc.from('sms_opt_outs').upsert({ phone }, { onConflict: 'phone' })
    return NextResponse.json({ ok: true, action: 'opted_out' })
  }

  // START / UNSTOP
  if (upper === 'START' || upper === 'UNSTOP') {
    await svc.from('sms_opt_outs').delete().eq('phone', phone)
    return NextResponse.json({ ok: true, action: 'opted_in' })
  }

  // HELP
  if (upper === 'HELP') {
    await sendTextRequestReply(
      phone,
      'OEH Alerts: Reply STOP to unsubscribe from load notifications. Reply START to re-subscribe. Visit oversize-escort-hub.com for support.'
    )
    return NextResponse.json({ ok: true, action: 'help_sent' })
  }

  // Load post path — must start with OEH
  if (upper.startsWith('OEH ')) {
    const result = parseSms(messageText)
    if (!result.ok) {
      console.error('SMS parse failed:', result.error, 'text=', messageText)
      await sendTextRequestReply(
        phone,
        `OEH: Could not parse load (${result.error}). Format: OEH [flat|bid|open] [city] [ST] [city] [ST] [M/D] [position] [rate]`
      )
      return NextResponse.json({ ok: true, parsed: false })
    }

    const d = result.data
    const carrierId = await lookupCarrierId(phone)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const insertRow = {
      carrier_id: carrierId,
      board_type: d.boardType,
      pu_city: d.puCity,
      pu_state: d.puState,
      dl_city: d.dlCity,
      dl_state: d.dlState,
      position: d.position,
      status: 'open',
      per_mile_rate: d.perMileRate,
      day_rate: 500,
      overnight_fee: 100,
      no_go_fee: 250,
      pay_type: 'FastPay',
      start_date: d.startDate,
      expires_at: expiresAt,
      notes: messageText,
    }

    const { data: inserted, error: insErr } = await svc
      .from('loads')
      .insert(insertRow)
      .select('id')
      .single()

    if (insErr) {
      console.error('SMS insert failed:', JSON.stringify(insErr), 'row=', JSON.stringify(insertRow))
      await sendTextRequestReply(
        phone,
        `OEH: Load parsed but failed to post. Please try again or contact support.`
      )
      return NextResponse.json({ ok: true, inserted: false })
    }

    console.log('SMS load inserted:', inserted?.id, 'carrier_id=', carrierId)
    await sendTextRequestReply(
      phone,
      `OEH: Load posted. ${d.boardType} ${d.puCity} ${d.puState} → ${d.dlCity} ${d.dlState} ${d.startDate} ${d.position} $${d.perMileRate}/mi.`
    )
    return NextResponse.json({ ok: true, inserted: true, id: inserted?.id })
  }

  // Fallthrough — unknown message
  return NextResponse.json({ ok: true })
}
