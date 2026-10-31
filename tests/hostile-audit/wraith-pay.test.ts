import fs from 'node:fs'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'

const m = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[], reply: null as unknown }))
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error { status = 500 }
  class Anthropic {
    static APIError = APIError
    constructor(public opts: Record<string, unknown> = {}) { void opts }
    messages = { create: async (p: Record<string, unknown>) => { m.calls.push(p); return m.reply } }
  }
  return { default: Anthropic }
})
import { GET, POST } from '@/app/api/wraith/route'
import { POST as checkout } from '@/app/api/wraith/checkout/route'
import { POST as portal } from '@/app/api/wraith/portal/route'
import { POST as webhook } from '@/app/api/webhook/route'
import { WRAITH_FREE_DAILY, hasWraithAccess, wraithPriceText } from '@/lib/wraith-access'
import { serviceClient } from '@/lib/service-client'

const ME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PRICE = 'price_wraith_test'
const say = (text: string) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })
const ask = () => POST(new NextRequest('http://localhost/api/wraith', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'any loads?' }] }) }))
const post = (path: string) => new Request('http://localhost' + path, { method: 'POST' })
const hook = async (event: unknown) => { getDb().stripeEvent = event; return webhook(new NextRequest('http://localhost/api/webhook', { method: 'POST', body: '{}', headers: { 'stripe-signature': 't' } })) }
const uses = (n: number) => { getDb().tables.helper_usage = Array.from({ length: n }, (_, i) => ({ id: 'u' + i, key: 'u:' + ME, kind: 'wraith', created_at: new Date().toISOString() })) }
const access = () => getDb().tables.wraith_access

beforeEach(() => {
  resetHostile(); m.calls.length = 0; m.reply = say('ok')
  process.env.WRAITH_LIVE = 'on'; process.env.ANTHROPIC_API_KEY = 'k'; process.env.STRIPE_WRAITH_PRICE_ID = PRICE; process.env.STRIPE_SECRET_KEY = 'sk_test'
  getDb().sessionUser = { id: ME, email: 'me@x.example' }
  getDb().tables.profiles = [{ id: ME, role: 'escort', email: 'me@x.example', tier: 'free', stripe_customer_id: null, stripe_subscription_id: null }]
  getDb().tables.wraith_access = []
})
afterEach(() => { for (const k of ['WRAITH_LIVE', 'ANTHROPIC_API_KEY', 'STRIPE_WRAITH_PRICE_ID', 'STRIPE_SECRET_KEY']) delete process.env[k] })

test('free taste: five questions a day, then it asks for the subscription without calling the model', async () => {
  uses(WRAITH_FREE_DAILY - 1)
  const ok = await (await ask()).json()
  expect(ok.reply).toBe('ok'); expect(ok.paid).toBe(false); expect(ok.freeLeft).toBe(0)
  uses(WRAITH_FREE_DAILY); m.calls.length = 0
  const r = await (await ask()).json()
  expect(r.upgrade).toBe(true); expect(r.freeLeft).toBe(0)
  expect(m.calls).toHaveLength(0)
})

test('a live subscription removes the free limit (still capped per hour); an ended one does not; the owner account is always in', async () => {
  uses(WRAITH_FREE_DAILY)
  access().push({ user_id: ME, status: 'active', current_period_end: new Date(Date.now() + 86400000).toISOString() })
  expect((await (await ask()).json()).upgrade).toBeUndefined()
  access()[0].status = 'canceled'
  expect((await (await ask()).json()).upgrade).toBe(true)
  access()[0].status = 'active'; access()[0].current_period_end = new Date(Date.now() - 5 * 86400000).toISOString() // lapsed beyond the grace
  expect(await hasWraithAccess(serviceClient(), ME, 'me@x.example')).toBe(false)
  access()[0].current_period_end = new Date(Date.now() - 86400000).toISOString() // a late renewal notice is tolerated
  expect(await hasWraithAccess(serviceClient(), ME, 'me@x.example')).toBe(true)
  expect(await hasWraithAccess(serviceClient(), 'nobody', 'bahmed3170@gmail.com')).toBe(true)
  expect(await hasWraithAccess(serviceClient(), 'nobody', 'x@x.example')).toBe(false)
})

test('status endpoint: signed-in only, shows plan and free questions left', async () => {
  uses(2)
  expect(await (await GET()).json()).toEqual({ paid: false, freeLeft: WRAITH_FREE_DAILY - 2 })
  getDb().sessionUser = null
  expect((await GET()).status).toBe(401)
  delete process.env.WRAITH_LIVE
  expect((await GET()).status).toBe(404)
})

test('checkout: off, signed-out, no price set and already-subscribed are all refused; otherwise a subscription session for the fixed price', async () => {
  delete process.env.WRAITH_LIVE
  expect((await checkout(post('/api/wraith/checkout'))).status).toBe(404)
  process.env.WRAITH_LIVE = 'on'
  getDb().sessionUser = null
  expect((await checkout(post('/api/wraith/checkout'))).status).toBe(401)
  getDb().sessionUser = { id: ME, email: 'me@x.example' }
  delete process.env.STRIPE_WRAITH_PRICE_ID
  expect((await checkout(post('/api/wraith/checkout'))).status).toBe(503)
  process.env.STRIPE_WRAITH_PRICE_ID = PRICE
  access().push({ user_id: ME, status: 'active' })
  expect((await checkout(post('/api/wraith/checkout'))).status).toBe(409)
  access().length = 0
  const r = await checkout(post('/api/wraith/checkout'))
  expect(r.status).toBe(200); expect((await r.json()).url).toBe('https://checkout.test/session')
  const call = getDb().stripeCalls.find((c) => c.op === 'checkout')!.params as Record<string, any>
  expect(call.mode).toBe('subscription')
  expect(call.line_items).toEqual([{ price: PRICE, quantity: 1 }])
  expect(call.client_reference_id).toBe(ME)
  expect(call.success_url).toContain('/wraith?subscribed=1')
})

test('portal: only the signed-in person\'s own Wraith customer', async () => {
  expect((await portal(post('/api/wraith/portal'))).status).toBe(404)
  access().push({ user_id: ME, status: 'active', stripe_customer_id: 'cus_wr' })
  const r = await portal(post('/api/wraith/portal'))
  expect((await r.json()).url).toBe('https://portal.test/session')
  expect((getDb().stripeCalls.find((c) => c.op === 'portal')!.params as Record<string, unknown>).customer).toBe('cus_wr')
  getDb().sessionUser = null
  expect((await portal(post('/api/wraith/portal'))).status).toBe(401)
})

test('webhook: paying turns Wraith Pro on and never touches the plan; renewal, trouble and cancelling keep it in step', async () => {
  const done = { id: 'e1', type: 'checkout.session.completed', data: { object: { id: 'cs_1', payment_status: 'paid', customer: 'cus_wr', subscription: 'sub_wr', metadata: { userId: ME, priceId: PRICE }, client_reference_id: ME, line_items: { data: [{ price: { id: PRICE } }] } } } }
  expect((await hook(done)).status).toBe(200)
  expect(access()).toHaveLength(1)
  expect(access()[0]).toMatchObject({ user_id: ME, status: 'active', stripe_customer_id: 'cus_wr', stripe_subscription_id: 'sub_wr' })
  expect(getDb().tables.profiles[0]).toMatchObject({ tier: 'free', stripe_customer_id: null, stripe_subscription_id: null })
  const end = Math.floor(Date.now() / 1000) + 30 * 86400
  const sub = (status: string, type = 'customer.subscription.updated') => ({ id: 'e2' + status, type, data: { object: { id: 'sub_wr', status, customer: 'cus_wr', metadata: { userId: ME }, items: { data: [{ price: { id: PRICE }, current_period_end: end }] } } } })
  await hook(sub('active'))
  expect(access()).toHaveLength(1)
  expect(Date.parse(access()[0].current_period_end as string)).toBeGreaterThan(Date.now() + 29 * 86400000)
  await hook(sub('past_due'))
  expect(access()[0].status).toBe('past_due')
  expect(await hasWraithAccess(serviceClient(), ME, 'me@x.example')).toBe(false)
  await hook(sub('active'))
  expect(await hasWraithAccess(serviceClient(), ME, 'me@x.example')).toBe(true)
  await hook(sub('canceled', 'customer.subscription.deleted'))
  expect(access()[0].status).toBe('canceled')
  expect(getDb().tables.profiles[0].tier).toBe('free')
})

test('webhook: an unpaid checkout or a different price grants no Wraith access', async () => {
  const base = { id: 'cs_2', customer: 'cus', subscription: 'sub', metadata: { userId: ME }, client_reference_id: ME }
  await hook({ id: 'e3', type: 'checkout.session.completed', data: { object: { ...base, payment_status: 'unpaid', line_items: { data: [{ price: { id: PRICE } }] } } } })
  await hook({ id: 'e4', type: 'checkout.session.completed', data: { object: { ...base, payment_status: 'paid', line_items: { data: [{ price: { id: 'price_other' } }] } } } })
  expect(access()).toHaveLength(0)
  delete process.env.STRIPE_WRAITH_PRICE_ID // price not configured: an empty setting must never match anything
  await hook({ id: 'e5', type: 'checkout.session.completed', data: { object: { ...base, payment_status: 'paid', line_items: { data: [{ price: { id: '' } }] } } } })
  expect(access()).toHaveLength(0)
})

test('the price shown comes from Stripe; the table is service-only; the page has no buy button inside the phone apps', async () => {
  expect(await wraithPriceText()).toBe('$9.99 a month')
  delete process.env.STRIPE_WRAITH_PRICE_ID
  expect(await wraithPriceText()).toBe(null)
  const sql = fs.readFileSync('docs/sql-wraith-access.sql', 'utf8')
  expect(sql).toMatch(/enable row level security/); expect(sql).toMatch(/revoke all on public\.wraith_access from anon, authenticated/)
  const client = fs.readFileSync('components/wraith/WraithClient.tsx', 'utf8')
  expect(client).toContain('!inApp && canSubscribe')
  expect(client).toContain("isNativeApp()")
  expect(fs.readFileSync('app/terms/page.tsx', 'utf8')).toMatch(/38\. Wraith voice assistant/)
  expect(fs.readFileSync('app/privacy/page.tsx', 'utf8')).toMatch(/32\. Wraith voice assistant/)
})
