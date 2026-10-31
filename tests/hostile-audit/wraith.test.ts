import fs from 'node:fs'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'

const m = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[], reply: null as unknown }))
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error { status = 500; constructor(msg = '', status = 500) { super(msg); this.status = status } }
  class Anthropic {
    static APIError = APIError
    constructor(public opts: Record<string, unknown> = {}) { void opts }
    messages = { create: async (p: Record<string, unknown>) => { m.calls.push(JSON.parse(JSON.stringify(p))); const r = typeof m.reply === 'function' ? (m.reply as (p: Record<string, unknown>) => unknown)(p) : m.reply; if (r instanceof Error) throw r; return r } }
  }
  return { default: Anthropic }
})
import { POST } from '@/app/api/wraith/route'
import { WRAITH_LIMITS, WRAITH_SYSTEM, WRAITH_TOOLS, runWraithTool, speakable } from '@/lib/wraith'
import { serviceClient } from '@/lib/service-client'

const ME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const BLOCKED = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const L1 = '11111111-1111-4111-8111-111111111111'
const L2 = '22222222-2222-4222-8222-222222222222'
const L3 = '33333333-3333-4333-8333-333333333333'
const L4 = '44444444-4444-4444-8444-444444444444'
const future = new Date(Date.now() + 5 * 86400000).toISOString()
const say = (text: string) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })
const useTool = (name: string, input: Record<string, unknown> = {}) => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name, input }] })
const ask = (messages: unknown = [{ role: 'user', content: 'any loads in Texas?' }]) => POST(new NextRequest('http://localhost/api/wraith', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages }) }))

beforeEach(() => {
  resetHostile(); m.calls.length = 0; m.reply = say('ok')
  process.env.WRAITH_LIVE = 'on'; process.env.ANTHROPIC_API_KEY = 'test-key'
  getDb().sessionUser = { id: ME, email: 'me@x.example' }
  getDb().tables.profiles = [{ id: ME, role: 'escort', full_name: 'Me', email: 'me@x.example', phone: '555-000-1111' }, { id: OTHER, role: 'carrier', full_name: 'Other', email: 'other@x.example', phone: '555-222-3333' }]
  getDb().tables.loads = [
    { id: L1, carrier_id: OTHER, status: 'open', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', per_mile_rate: 2.25, escort_type: 'Lead', board_type: 'flat-rate', expires_at: future },
    { id: L2, carrier_id: BLOCKED, status: 'open', pu_city: 'Austin', pu_state: 'TX', dl_city: 'Waco', dl_state: 'TX', per_mile_rate: 2, expires_at: future },
    { id: L3, carrier_id: OTHER, status: 'filled', pu_city: 'Reno', pu_state: 'NV', dl_city: 'Boise', dl_state: 'ID', expires_at: future },
    { id: L4, carrier_id: ME, status: 'open', pu_city: 'Mine', pu_state: 'TX', dl_city: 'Own', dl_state: 'TX', expires_at: future },
  ]
  getDb().tables.user_blocks = [{ blocker_id: ME, blocked_id: BLOCKED }]
})
afterEach(() => { delete process.env.WRAITH_LIVE; delete process.env.ANTHROPIC_API_KEY })

test('it is off (a plain 404, no model call) unless WRAITH_LIVE=on', async () => {
  delete process.env.WRAITH_LIVE
  expect((await ask()).status).toBe(404)
  process.env.WRAITH_LIVE = 'yes'
  expect((await ask()).status).toBe(404)
  expect(m.calls).toHaveLength(0)
})

test('signed-out callers are refused and nothing is looked up', async () => {
  getDb().sessionUser = null
  expect((await ask()).status).toBe(401)
  expect(m.calls).toHaveLength(0)
})

test('bad input is refused; a missing key says it is not switched on', async () => {
  expect((await ask('nope')).status).toBe(400)
  expect((await ask([])).status).toBe(400)
  delete process.env.ANTHROPIC_API_KEY
  expect((await (await ask()).json()).off).toBe(true)
  expect(m.calls).toHaveLength(0)
})

test('search_open_loads: only open loads, never the caller\'s own, never a blocked poster, no contact details', async () => {
  const out = await runWraithTool('search_open_loads', { state: '' }, ME, serviceClient())
  const d = JSON.parse(out.json)
  expect(d.count).toBe(1)
  expect(d.loads[0]).toMatchObject({ from: 'Dallas, TX', to: 'Tulsa, OK', rate: '2.25 dollars a mile' })
  expect(out.json).not.toMatch(/@|555-|email|phone|carrier_id/)
  expect(out.links).toEqual([{ label: 'Dallas, TX to Tulsa, OK', href: `/loads/${L1}` }])
  const nv = JSON.parse((await runWraithTool('search_open_loads', { state: 'NV' }, ME, serviceClient())).json)
  expect(nv.count).toBe(0) // the Reno load is filled
  const blockedMe = JSON.parse((await runWraithTool('search_open_loads', { state: 'TX' }, BLOCKED, serviceClient())).json)
  expect(blockedMe.loads.map((l: { from: string }) => l.from)).not.toContain('Austin, TX') // their own load never listed back to them
})

test('a block hides the poster in both directions', async () => {
  getDb().tables.loads.push({ id: '55555555-5555-4555-8555-555555555555', carrier_id: ME, status: 'open', pu_city: 'Mine2', pu_state: 'OK', dl_city: 'X', dl_state: 'OK', expires_at: future })
  const asBlocked = JSON.parse((await runWraithTool('search_open_loads', { state: 'OK' }, BLOCKED, serviceClient())).json)
  expect(asBlocked.loads.map((l: { from: string }) => l.from)).not.toContain('Mine2, OK')
})

test('my_bids and my_posted_loads only return the caller\'s own rows', async () => {
  getDb().tables.bids = [
    { id: 'b1', load_id: L1, escort_id: ME, rate: 410, status: 'pending' },
    { id: 'b2', load_id: L1, escort_id: OTHER, rate: 999, status: 'accepted' },
    { id: 'b3', load_id: L4, escort_id: OTHER, rate: 300, status: 'pending' },
  ]
  const mine = JSON.parse((await runWraithTool('my_bids', {}, ME, serviceClient())).json)
  expect(mine.count).toBe(1)
  expect(mine.bids[0]).toMatchObject({ bid: '410 dollars', status: 'pending' })
  const posted = JSON.parse((await runWraithTool('my_posted_loads', {}, ME, serviceClient())).json)
  expect(posted.loads).toEqual([{ route: 'Mine, TX to Own, TX', status: 'open', bids: 1 }])
})

test('my_expiring_documents only returns the caller\'s own documents and flags expired ones', async () => {
  getDb().tables.certifications = [
    { id: 'c1', user_id: ME, type: 'insurance', expiry_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10) },
    { id: 'c2', user_id: ME, type: 'pevo', expiry_date: '2001-01-01' },
    { id: 'c3', user_id: ME, type: 'vehicle', expiry_date: '2099-01-01' },
    { id: 'c4', user_id: OTHER, type: 'insurance', expiry_date: '2001-01-01' },
  ]
  const d = JSON.parse((await runWraithTool('my_expiring_documents', {}, ME, serviceClient())).json)
  expect(d.documents).toHaveLength(2)
  expect(d.documents.some((x: { expired: boolean }) => x.expired)).toBe(true)
})

test('the full path: the model calls a tool, gets scoped data, answers; links come from the data, not the model', async () => {
  let n = 0
  m.reply = () => (++n === 1 ? useTool('search_open_loads', { state: 'TX' }) : say('There is one open load, Dallas to Tulsa, **2.25** a mile. https://evil.example/x'))
  const r = await (await ask()).json()
  expect(r.reply).toBe('There is one open load, Dallas to Tulsa, 2.25 a mile.')
  expect(r.links).toEqual([{ label: 'Dallas, TX to Tulsa, OK', href: `/loads/${L1}` }])
  const first = m.calls[0], second = m.calls[1] as { messages: { role: string; content: unknown }[] }
  expect(first.model).toBe('claude-haiku-5-5')
  expect(first.max_tokens).toBeLessThanOrEqual(WRAITH_LIMITS.maxOutputTokens)
  expect(first.system).toBe(WRAITH_SYSTEM)
  expect(first.tools).toEqual(WRAITH_TOOLS)
  expect(JSON.stringify(second.messages)).toContain('Dallas, TX')
  expect(JSON.stringify(second.messages)).not.toContain('Austin')
})

test('a model that keeps calling tools is stopped after a few rounds', async () => {
  m.reply = useTool('my_bids')
  const r = await (await ask()).json()
  expect(m.calls.length).toBeLessThanOrEqual(WRAITH_LIMITS.maxToolRounds + 1)
  expect(typeof r.reply).toBe('string')
})

test('an unknown tool name does nothing', async () => {
  const out = await runWraithTool('delete_everything', {}, ME, serviceClient())
  expect(JSON.parse(out.json)).toEqual({ error: 'unknown tool' })
})

test('per-person limits stop it before the model is called', async () => {
  getDb().tables.wraith_access = [{ user_id: ME, status: 'active', current_period_end: null }] // a subscriber: the free-taste limit does not apply, the hourly cap still does
  getDb().tables.helper_usage = Array.from({ length: WRAITH_LIMITS.perKeyHour }, (_, i) => ({ id: 'u' + i, key: 'u:' + ME, kind: 'wraith', created_at: new Date().toISOString() }))
  const r = await (await ask()).json()
  expect(r.limited).toBe(true)
  expect(m.calls).toHaveLength(0)
})

test('only the cheap Haiku models, no tools that write, and the prompt keeps the OEH rules', () => {
  expect(WRAITH_TOOLS.map((t) => t.name).sort()).toEqual(['my_bids', 'my_expiring_documents', 'my_posted_loads', 'search_open_loads'])
  expect(WRAITH_SYSTEM).toMatch(/cannot bid, claim, post, accept or change anything/)
  expect(WRAITH_SYSTEM).toMatch(/OEH does not check anyone/)
  expect(WRAITH_SYSTEM).toMatch(/I'm Wraith, OEH's automated assistant/)
  expect(speakable('## Hi **there** _you_ https://x.y/z')).toBe('Hi there you')
  // the tools file can only read; the route's single write is the usage counter row
  expect(fs.readFileSync('lib/wraith.ts', 'utf8')).not.toMatch(/\.(insert|update|delete|upsert)\(/)
  const route = fs.readFileSync('app/api/wraith/route.ts', 'utf8')
  expect(route.match(/\.(insert|update|delete|upsert)\(/g)).toEqual(['.insert('])
  expect(route).toContain("from('helper_usage').insert")
})

test('the Wraith page is hidden: 404 when off, signed-in only, noindex, and not in the sitemap or robots allow list', () => {
  const page = fs.readFileSync('app/wraith/page.tsx', 'utf8')
  expect(page).toMatch(/if \(!wraithLive\(\)\) notFound\(\)/)
  expect(page).toContain("redirect('/signin?redirect=/wraith')")
  expect(page).toMatch(/robots: \{ index: false, follow: false \}/)
  expect(fs.readFileSync('app/sitemap.ts', 'utf8')).not.toMatch(/wraith/i)
})

test('the voice page never lets text from the assistant become a link to another site', () => {
  const client = fs.readFileSync('components/wraith/WraithClient.tsx', 'utf8')
  expect(client).toMatch(/l\.href\.startsWith\('\/'\)/)
  expect(client).not.toMatch(/dangerouslySetInnerHTML/)
})
