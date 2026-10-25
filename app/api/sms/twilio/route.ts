import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/security'
import { parseSms, phoneCandidates } from '@/lib/sms-parse'
import { twilioCandidateUrls, twilioSignatureValid } from '@/lib/twilio-signature'

export const dynamic = 'force-dynamic'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const START_WORDS = new Set(['START', 'YES', 'UNSTOP'])
const HELP_TEXT = 'Oversize Escort Hub: Need help? Visit oversize-escort-hub.com/contact. Msg frequency varies. Msg & data rates may apply. Reply STOP to unsubscribe.'

function smsEnabled(): boolean {
  return process.env.SMS_ENABLED === 'true'
}

function parseForm(raw: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of new URLSearchParams(raw)) {
    params[key] = key in params ? params[key] + value : value
  }
  return params
}

function twiml(message: string | null): NextResponse {
  const inner = message ? `<Message>${escapeHtml(message)}</Message>` : ''
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

async function setSmsOptIn(phone: string, optedIn: boolean) {
  const candidates = phoneCandidates(phone)
  if (!candidates.length) return
  const orFilter = candidates.map((c) => `phone.eq.${c}`).join(',')
  const { data } = await svc.from('profiles').select('id').or(orFilter).limit(20)
  for (const row of data || []) {
    const id = (row as { id?: string }).id
    if (!id) continue
    await svc.from('profiles').update({ sms_opt_in: optedIn }).eq('id', id)
  }
}

async function optOut(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return
  const { data: existing, error } = await svc.from('sms_opt_outs').select('id').eq('phone', trimmed).maybeSingle()
  if (error || !existing) {
    await svc.from('sms_opt_outs').insert({ phone: trimmed, opted_out_at: new Date().toISOString() })
  }
  await setSmsOptIn(trimmed, false)
}

async function optIn(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return
  for (const candidate of phoneCandidates(trimmed)) {
    await svc.from('sms_opt_outs').delete().eq('phone', candidate)
  }
  await setSmsOptIn(trimmed, true)
}

const MAX_LOADS_PER_DAY = 30

type SmsSender = { id: string; sms_opt_in: boolean; role: string | null; suspended: boolean }

async function lookupCarrier(phoneRaw: string): Promise<SmsSender | null> {
  const candidates = phoneCandidates(phoneRaw)
  if (!candidates.length) return null
  const orFilter = candidates.map((c) => `phone.eq.${c}`).join(',')
  const { data, error } = await svc.from('profiles').select('id, sms_opt_in, role, suspended').or(orFilter).limit(20)
  if (error || !data?.length) return null
  const rows = data as { id: string; sms_opt_in?: boolean; role?: string | null; suspended?: boolean | null }[]
  // Two profiles can share a number. Prefer one that opted in and is allowed to post.
  const eligible = rows.find((r) => r.sms_opt_in === true && !r.suspended && ['carrier', 'broker', 'admin'].includes(r.role ?? ''))
  const row = eligible ?? rows[0]
  return { id: row.id, sms_opt_in: row.sms_opt_in === true, role: row.role ?? null, suspended: row.suspended === true }
}

async function confirmByEmail(
  carrierId: string,
  insertedIds: string[],
  data: { boardType: string; puCity: string; puState: string; dlCity: string; dlState: string; startDate: string; positions: string[]; perMileRate: number },
) {
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return
    const { data: prof } = await svc.from('profiles').select('email, full_name, company_name').eq('id', carrierId).single()
    const profAny = prof as { email?: string; full_name?: string; company_name?: string } | null
    let carrierEmail = profAny?.email
    if (!carrierEmail && typeof svc.auth.admin.getUserById === 'function') {
      try {
        const { data: userRes, error: userErr } = await svc.auth.admin.getUserById(carrierId)
        if (userErr) console.error('SMS email confirm: auth lookup failed')
        else carrierEmail = userRes?.user?.email ?? undefined
      } catch {
        console.error('SMS email confirm: auth lookup failed')
      }
    }
    if (!carrierEmail) return
    const greeting = escapeHtml(profAny?.full_name || profAny?.company_name || 'Carrier')
    const rows = insertedIds
      .map((id, i) => `<li>${escapeHtml(data.positions[i])} — Load ID <code>${escapeHtml(id)}</code></li>`)
      .join('')
    const boardPath = data.boardType === 'flat-rate' ? 'flat-rate' : data.boardType === 'bid' ? 'bid-board' : 'open-loads'
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'OEH Loads <noreply@oversize-escort-hub.com>',
        to: carrierEmail,
        subject: `OEH: ${insertedIds.length > 1 ? insertedIds.length + ' loads' : 'Load'} posted — ${data.puCity} ${data.puState} → ${data.dlCity} ${data.dlState}`,
        html: `<p>Hi ${greeting},</p><p>Your SMS load post was confirmed:</p><ul><li><strong>Board:</strong> ${data.boardType}</li><li><strong>Pickup:</strong> ${escapeHtml(data.puCity)}, ${escapeHtml(data.puState)}</li><li><strong>Drop:</strong> ${escapeHtml(data.dlCity)}, ${escapeHtml(data.dlState)}</li><li><strong>Date:</strong> ${data.startDate}</li><li><strong>Rate:</strong> $${data.perMileRate}/mi</li></ul><p><strong>Positions:</strong></p><ul>${rows}</ul><p>View on the board: <a href="https://oversize-escort-hub.com/${boardPath}">oversize-escort-hub.com</a></p>`,
      }),
    })
  } catch {
    console.error('SMS email confirm failed')
  }
}

async function postLoad(phone: string, messageText: string): Promise<NextResponse> {
  const result = parseSms(messageText)
  if (!result.ok) {
    console.error('SMS parse failed', result.error)
    return twiml(`OEH: Could not parse load (${result.error}). Format: OEH [flat|bid|open] [city] [ST] [city] [ST] [M/D] [position] [rate]`)
  }

  const carrier = await lookupCarrier(phone)
  if (!carrier) {
    return twiml('Phone not registered. Sign up free at oversize-escort-hub.com then text again.')
  }
  if (!carrier.sms_opt_in) {
    return twiml('OEH: This number is not opted in. Reply YES to opt in, then text the load again.')
  }
  const { data: optOuts } = await svc.from('sms_opt_outs').select('id').in('phone', phoneCandidates(phone)).limit(1)
  if (optOuts && optOuts.length > 0) {
    return twiml('OEH: This number is unsubscribed. Reply START to opt in.')
  }
  if (carrier.suspended || !['carrier', 'broker', 'admin'].includes(carrier.role ?? '')) {
    return twiml('OEH: This account cannot post loads by text. Sign in at oversize-escort-hub.com.')
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await svc.from('loads').select('id').eq('carrier_id', carrier.id).gte('created_at', since).limit(MAX_LOADS_PER_DAY + 1)
  if ((recent?.length ?? 0) + result.data.positions.length > MAX_LOADS_PER_DAY) {
    return twiml('OEH: Daily text-post limit reached. Post more at oversize-escort-hub.com.')
  }

  const d = result.data
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const insertedIds: string[] = []
  for (const pos of d.positions) {
    const insertRow = {
      carrier_id: carrier.id,
      board_type: d.boardType,
      pu_city: d.puCity,
      pu_state: d.puState,
      dl_city: d.dlCity,
      dl_state: d.dlState,
      position: pos,
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
    const { data: inserted, error: insErr } = await svc.from('loads').insert(insertRow).select('id').single()
    if (insErr || !inserted?.id) {
      console.error('SMS insert failed')
      continue
    }
    insertedIds.push(inserted.id as string)
  }

  if (insertedIds.length === 0) {
    return twiml('OEH: Load parsed but failed to post. Please try again or contact support.')
  }

  const positionsLabel = d.positions.join('+')
  const countLabel = insertedIds.length > 1 ? ` (${insertedIds.length} loads)` : ''
  await confirmByEmail(carrier.id, insertedIds, d)
  return twiml(`OEH: Load posted${countLabel}. ${d.boardType} ${d.puCity} ${d.puState} → ${d.dlCity} ${d.dlState} ${d.startDate} ${positionsLabel} $${d.perMileRate}/mi.`)
}

export async function POST(req: NextRequest) {
  if (!smsEnabled()) return forbidden()

  const raw = await req.text()
  const params = parseForm(raw)
  const signature = req.headers.get('x-twilio-signature')
  const token = process.env.TWILIO_AUTH_TOKEN
  const urls = twilioCandidateUrls({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    forwardedProto: req.headers.get('x-forwarded-proto'),
    forwardedHost: req.headers.get('x-forwarded-host'),
    host: req.headers.get('host'),
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
  })
  const signed = urls.some((url) => twilioSignatureValid(token, signature, url, params))
  if (!signed) return forbidden()

  try {
    const phone = (params.From || params.from || '').trim()
    const messageText = (params.Body || params.body || '').toString()
    if (!phone) return twiml(null)

    const upper = messageText.trim().toUpperCase()
    if (STOP_WORDS.has(upper)) {
      await optOut(phone)
      return twiml('Oversize Escort Hub: You are unsubscribed. No more messages will be sent. Reply START to opt in again.')
    }
    if (START_WORDS.has(upper)) {
      await optIn(phone)
      return twiml('Oversize Escort Hub: You are opted in. Reply HELP for help or STOP to unsubscribe. Msg & data rates may apply.')
    }
    if (upper === 'HELP') return twiml(HELP_TEXT)

    return await postLoad(phone, messageText)
  } catch {
    console.error('SMS webhook failed')
    return twiml('Oversize Escort Hub: Something went wrong. Please try again.')
  }
}
