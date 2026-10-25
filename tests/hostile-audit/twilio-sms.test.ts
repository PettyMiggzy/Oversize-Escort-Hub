import { createHmac } from 'crypto'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { sendSms } from '@/lib/twilio'
import { POST as twilioWebhook } from '@/app/api/sms/twilio/route'
import { POST as textRequestWebhook } from '@/app/api/sms/textrequest-webhook/route'

// These assertions are the Twilio webhook and sender. They fail on the old TextRequest route and sender.

const SID = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const TOKEN = 'test-auth-token'
const FROM = '+18556014751'
const SITE = 'https://oversize-escort-hub.com'
const PATH = '/api/sms/twilio'
const PHONE = '+15551234567'
const ENV_KEYS = ['SMS_ENABLED', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'TWILIO_MESSAGING_SERVICE_SID', 'NEXT_PUBLIC_SITE_URL'] as const
const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]])) as Record<(typeof ENV_KEYS)[number], string | undefined>

const fetches: { url: string; init?: RequestInit }[] = []

function twilioCalls() {
  return fetches.filter((call) => call.url.startsWith('https://api.twilio.com/'))
}

function sign(url: string, params: Record<string, string>, token = TOKEN) {
  const data = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url)
  return createHmac('sha1', token).update(data).digest('base64')
}

function form(extra: Record<string, string>): Record<string, string> {
  return {
    To: FROM,
    MessageSid: 'SM123',
    Body: extra.Body ?? 'HELP',
    From: extra.From ?? PHONE,
    AccountSid: SID,
    ...extra,
  }
}

async function postTwilio(extra: Record<string, string>, opts?: { signature?: string | null; url?: string }) {
  const params = form(extra)
  const body = new URLSearchParams(params).toString()
  const signedUrl = opts?.url ?? `${SITE}${PATH}`
  const signature = opts && 'signature' in opts ? opts.signature : sign(signedUrl, params)
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
    'x-forwarded-host': 'proxy.internal',
    'x-forwarded-proto': 'https',
  }
  if (signature) headers['x-twilio-signature'] = signature
  return twilioWebhook(new NextRequest(`http://localhost${PATH}`, { method: 'POST', body, headers }))
}

function carrier(smsOptIn: boolean) {
  getDb().tables.profiles = [{ id: 'c1', role: 'carrier', phone: PHONE, sms_opt_in: smsOptIn }]
}

beforeEach(() => {
  resetHostile()
  fetches.length = 0
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    fetches.push({ url, init })
    return new Response('{"sid":"SM_TEST"}', { status: 201, headers: { 'content-type': 'application/json' } })
  })
  process.env.SMS_ENABLED = 'true'
  process.env.TWILIO_ACCOUNT_SID = SID
  process.env.TWILIO_AUTH_TOKEN = TOKEN
  process.env.TWILIO_FROM = FROM
  process.env.NEXT_PUBLIC_SITE_URL = SITE
  delete process.env.TWILIO_MESSAGING_SERVICE_SID
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

test('an invalid signature is refused', async () => {
  carrier(true)
  const res = await postTwilio({ Body: 'HELP' }, { signature: 'not-a-valid-signature' })
  expect(res.status).toBe(403)
  expect(twilioCalls()).toHaveLength(0)
  expect(getDb().tables.loads ?? []).toHaveLength(0)
})

test('a missing signature is refused', async () => {
  const res = await postTwilio({ Body: 'HELP' }, { signature: null })
  expect(res.status).toBe(403)
  expect(twilioCalls()).toHaveLength(0)
})

test('a missing auth token is refused', async () => {
  const params = form({ Body: 'HELP' })
  const signature = sign(`${SITE}${PATH}`, params)
  delete process.env.TWILIO_AUTH_TOKEN
  const res = await postTwilio({ Body: 'HELP' }, { signature })
  expect(res.status).toBe(403)
})

test('a valid signature for the public site URL is accepted', async () => {
  const res = await postTwilio({ Body: 'HELP' }, { url: `${SITE}${PATH}` })
  expect(res.status).toBe(200)
  expect(await res.text()).toContain('<Message>')
  expect(twilioCalls()).toHaveLength(0)
})

test('a valid signature for the forwarded host is accepted', async () => {
  const res = await postTwilio({ Body: 'HELP' }, { url: `https://proxy.internal${PATH}` })
  expect(res.status).toBe(200)
  const xml = await res.text()
  expect(xml).toContain('<Response>')
  expect(xml).toContain('oversize-escort-hub.com/contact')
})

test('a signature for any other URL is refused', async () => {
  const res = await postTwilio({ Body: 'HELP' }, { url: `https://evil.example${PATH}` })
  expect(res.status).toBe(403)
  const localhost = await postTwilio({ Body: 'HELP' }, { url: `http://localhost${PATH}` })
  expect(localhost.status).toBe(403)
})

test('STOP then no further sends', async () => {
  carrier(true)
  process.env.TWILIO_MESSAGING_SERVICE_SID = 'MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const before = await sendSms(PHONE, 'hello')
  expect(before).toBe(true)
  expect(twilioCalls()).toHaveLength(1)
  const call = twilioCalls()[0]
  expect(call.url).toBe(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`)
  expect(call.url).not.toContain(TOKEN)
  const body = new URLSearchParams(String(call.init?.body ?? ''))
  expect(body.get('To')).toBe(PHONE)
  expect(body.get('From')).toBe(FROM)
  expect(body.get('Body')).toBe('hello')
  expect(body.get('MessagingServiceSid')).toBe('MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  const headers = call.init?.headers as Record<string, string>
  expect(headers.Authorization).toBe(`Basic ${Buffer.from(`${SID}:${TOKEN}`).toString('base64')}`)
  delete process.env.TWILIO_MESSAGING_SERVICE_SID

  fetches.length = 0
  const stopped = await postTwilio({ Body: 'STOP' })
  expect(stopped.status).toBe(200)
  expect(getDb().tables.profiles[0].sms_opt_in).toBe(false)
  expect((getDb().tables.sms_opt_outs ?? []).some((row) => row.phone === PHONE)).toBe(true)

  getDb().tables.profiles[0].sms_opt_in = true
  const after = await sendSms(PHONE, 'another')
  expect(after).toBe(false)
  expect(twilioCalls()).toHaveLength(0)
})

test('STOPALL, UNSUBSCRIBE, CANCEL, END, and QUIT opt the number out', async () => {
  for (const word of ['STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']) {
    resetHostile()
    carrier(true)
    const ignored = await postTwilio({ Body: `${word} please` })
    expect(ignored.status).toBe(200)
    expect(getDb().tables.profiles[0].sms_opt_in).toBe(true)
    expect(getDb().tables.sms_opt_outs ?? []).toHaveLength(0)

    const res = await postTwilio({ Body: word })
    expect(res.status).toBe(200)
    expect(getDb().tables.profiles[0].sms_opt_in).toBe(false)
    expect(await sendSms(PHONE, 'nope')).toBe(false)
  }
  expect(twilioCalls()).toHaveLength(0)
})

test('START, YES, and UNSTOP remove the opt-out', async () => {
  for (const word of ['START', 'YES', 'UNSTOP']) {
    resetHostile()
    carrier(true)
    await postTwilio({ Body: 'STOP' })
    expect(await sendSms(PHONE, 'blocked')).toBe(false)
    const res = await postTwilio({ Body: word })
    expect(res.status).toBe(200)
    expect(getDb().tables.profiles[0].sms_opt_in).toBe(true)
    expect(getDb().tables.sms_opt_outs ?? []).toHaveLength(0)
    expect(await sendSms(PHONE, 'restored')).toBe(true)
  }
})

test('a sender not opted in cannot post a load', async () => {
  const text = 'flat Dallas TX Tulsa OK 12/31/2026 Lead 2.5'
  carrier(false)
  expect(await sendSms(PHONE, 'hi')).toBe(false)
  const refused = await postTwilio({ Body: text })
  expect(refused.status).toBe(200)
  expect(await refused.text()).not.toContain('Load posted')
  expect(getDb().tables.loads ?? []).toHaveLength(0)

  getDb().tables.profiles = []
  const unknown = await postTwilio({ Body: text })
  expect(await unknown.text()).not.toContain('Load posted')
  expect(getDb().tables.loads ?? []).toHaveLength(0)
  expect(twilioCalls()).toHaveLength(0)
})

test('an opted-in registered sender can post a load', async () => {
  carrier(true)
  const res = await postTwilio({ Body: 'OEH flat Dallas TX Tulsa OK 12/31/2026 Lead 2.5' })
  expect(res.status).toBe(200)
  const xml = await res.text()
  expect(xml).toContain('Load posted')
  expect(xml.startsWith('<?xml')).toBe(true)
  const loads = getDb().tables.loads ?? []
  expect(loads).toHaveLength(1)
  expect(loads[0]).toMatchObject({
    carrier_id: 'c1',
    board_type: 'flat-rate',
    pu_city: 'Dallas',
    pu_state: 'TX',
    dl_city: 'Tulsa',
    dl_state: 'OK',
    start_date: '2026-12-31',
    position: 'Lead',
    per_mile_rate: 2.5,
    status: 'open',
  })
})

test('SMS_ENABLED unset means nothing sends', async () => {
  carrier(true)
  delete process.env.SMS_ENABLED
  expect(await sendSms(PHONE, 'hi')).toBe(false)
  const res = await postTwilio({ Body: 'flat Dallas TX Tulsa OK 12/31/2026 Lead 2.5' })
  expect(res.status).toBe(403)
  expect(getDb().tables.loads ?? []).toHaveLength(0)
  expect(getDb().tables.sms_opt_outs ?? []).toHaveLength(0)
  expect(fetches).toHaveLength(0)

  for (const off of ['false', 'TRUE', '1', '']) {
    process.env.SMS_ENABLED = off
    expect(await sendSms(PHONE, 'hi')).toBe(false)
  }
  expect(twilioCalls()).toHaveLength(0)
})

test('missing Twilio env means nothing sends', async () => {
  carrier(true)
  delete process.env.TWILIO_ACCOUNT_SID
  expect(await sendSms(PHONE, 'hi')).toBe(false)
  process.env.TWILIO_ACCOUNT_SID = SID
  delete process.env.TWILIO_FROM
  expect(await sendSms(PHONE, 'hi')).toBe(false)
  expect(twilioCalls()).toHaveLength(0)
})

test('message bodies are XML-escaped', async () => {
  const help = await postTwilio({ Body: 'HELP' })
  const helpXml = await help.text()
  expect(helpXml).toContain('Msg &amp; data rates may apply')
  expect(helpXml).not.toContain('Msg & data')
  const helpInner = helpXml.slice(helpXml.indexOf('<Message>') + '<Message>'.length, helpXml.indexOf('</Message>'))
  expect(helpInner.includes('<')).toBe(false)

  carrier(true)
  const posted = await postTwilio({ Body: 'flat A<B TX Dallas TX 12/31/2026 Lead 2.5' })
  const xml = await posted.text()
  expect(xml).toContain('A&lt;b')
  const inner = xml.slice(xml.indexOf('<Message>') + '<Message>'.length, xml.indexOf('</Message>'))
  expect(inner.includes('<')).toBe(false)
  expect(inner.includes('&lt;')).toBe(true)
  expect(getDb().tables.loads?.[0]?.pu_city).toBe('A<b')
})

test('the TextRequest webhook is gone', async () => {
  const res = await textRequestWebhook()
  expect(res.status).toBe(410)
  expect(twilioCalls()).toHaveLength(0)
})

test('a number saved in another format still honors STOP and opt-in', async () => {
  getDb().tables.profiles = [{ id: 'c1', role: 'carrier', phone: '(555) 123-4567', sms_opt_in: true }]
  expect(await sendSms(PHONE, 'hi')).toBe(true)
  getDb().tables.sms_opt_outs = [{ id: 'o1', phone: '5551234567' }]
  expect(await sendSms(PHONE, 'hi')).toBe(false)
  getDb().tables.sms_opt_outs = []
  getDb().tables.profiles = [
    { id: 'c1', role: 'carrier', phone: '(555) 123-4567', sms_opt_in: true },
    { id: 'c2', role: 'carrier', phone: PHONE, sms_opt_in: false },
  ]
  expect(await sendSms(PHONE, 'hi')).toBe(false)
})

test('only carriers, brokers and admins in good standing can post by text', async () => {
  const text = 'flat Dallas TX Tulsa OK 12/31/2026 Lead 2.5'
  for (const [role, suspended] of [['escort', false], ['carrier', true]] as const) {
    resetHostile()
    getDb().tables.profiles = [{ id: 'c1', role, phone: PHONE, sms_opt_in: true, suspended }]
    const res = await postTwilio({ Body: text })
    expect(await res.text()).not.toContain('Load posted')
    expect(getDb().tables.loads ?? []).toHaveLength(0)
  }
  resetHostile()
  getDb().tables.profiles = [{ id: 'b1', role: 'broker', phone: PHONE, sms_opt_in: true, suspended: false }]
  expect(await (await postTwilio({ Body: text })).text()).toContain('Load posted')
})

test('a sender cannot post more than 30 loads a day by text', async () => {
  carrier(true)
  const now = new Date().toISOString()
  getDb().tables.loads = Array.from({ length: 29 }, (_, i) => ({ id: `l${i}`, carrier_id: 'c1', created_at: now }))
  const two = await postTwilio({ Body: 'flat Dallas TX Tulsa OK 12/31/2026 Lead Chase 2.5' })
  expect(await two.text()).not.toContain('Load posted')
  expect(getDb().tables.loads).toHaveLength(29)
  const one = await postTwilio({ Body: 'flat Dallas TX Tulsa OK 12/31/2026 Lead 2.5' })
  expect(await one.text()).toContain('Load posted')
  expect(getDb().tables.loads).toHaveLength(30)
})

test('the parser refuses absurd rates and too many positions', async () => {
  const { parseSms } = await import('@/lib/sms-parse')
  expect(parseSms('flat Dallas TX Tulsa OK 12/31/2026 Lead 51').ok).toBe(false)
  expect(parseSms('flat Dallas TX Tulsa OK 12/31/2026 Lead 50').ok).toBe(true)
  expect(parseSms('flat Dallas TX Tulsa OK 12/31/2026 a b c d e f g 2.5').ok).toBe(false)
  const dup = parseSms('flat Dallas TX Tulsa OK 12/31/2026 Lead Lead Lead 2.5')
  expect(dup.ok && dup.data.positions).toEqual(['Lead'])
})
