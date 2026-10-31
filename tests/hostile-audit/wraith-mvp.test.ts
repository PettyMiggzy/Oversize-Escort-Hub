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
    messages = { create: async (p: Record<string, unknown>) => { m.calls.push(JSON.parse(JSON.stringify(p))); return typeof m.reply === 'function' ? (m.reply as (p: unknown) => unknown)(p) : m.reply } }
  }
  return { default: Anthropic }
})
import { POST } from '@/app/api/wraith/route'
import { runWraithTool } from '@/lib/wraith'
import { serviceClient } from '@/lib/service-client'

const ME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const POSTER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const BLOCKED = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const E1 = 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1'
const E2 = 'e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2'
const L1 = '11111111-1111-4111-8111-111111111111'
const L2 = '22222222-2222-4222-8222-222222222222'
const L3 = '33333333-3333-4333-8333-333333333333'
const L4 = '44444444-4444-4444-8444-444444444444'
const L5 = '55555555-5555-4555-8555-555555555555'
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString()
const future = new Date(Date.now() + 5 * 86400000).toISOString()
const run = (name: string, input: unknown = {}, uid = ME) => runWraithTool(name, input, uid, serviceClient()).then((r) => ({ ...r, data: JSON.parse(r.json) }))
const say = (text: string) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })
const tool = (name: string, input: Record<string, unknown>) => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name, input }] })

beforeEach(() => {
  resetHostile(); m.calls.length = 0
  process.env.WRAITH_LIVE = 'on'; process.env.ANTHROPIC_API_KEY = 'k'
  getDb().sessionUser = { id: ME, email: 'me@x.example' }
  getDb().tables.wraith_access = [{ user_id: ME, status: 'active', current_period_end: null }]
  getDb().tables.profiles = [
    { id: ME, role: 'escort', full_name: 'Me', availability_states: ['TX'] },
    { id: POSTER, role: 'carrier', full_name: 'Poster' },
    { id: E1, role: 'escort', full_name: 'Dana Free', email: 'd@x.example', phone: '555-111-2222' },
    { id: E2, role: 'escort', full_name: 'Marcus Busy', email: 'm@x.example', phone: '555-333-4444' },
  ]
  const base = { carrier_id: POSTER, status: 'open', expires_at: future, per_mile_rate: 2.5 }
  getDb().tables.loads = [
    { ...base, id: L1, pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', created_at: hoursAgo(2) },
    { ...base, id: L2, pu_city: 'Reno', pu_state: 'NV', dl_city: 'Boise', dl_state: 'ID', created_at: hoursAgo(3) },     // not my states
    { ...base, id: L3, pu_city: 'Austin', pu_state: 'TX', dl_city: 'Waco', dl_state: 'TX', created_at: hoursAgo(50) },    // older than a day
    { ...base, id: L4, carrier_id: BLOCKED, pu_city: 'Laredo', pu_state: 'TX', dl_city: 'Eagle Pass', dl_state: 'TX', created_at: hoursAgo(1) },
    { ...base, id: L5, carrier_id: ME, pu_city: 'Mine', pu_state: 'TX', dl_city: 'Own', dl_state: 'TX', created_at: hoursAgo(1) },
  ]
  getDb().tables.user_blocks = [{ blocker_id: ME, blocked_id: BLOCKED }]
})
afterEach(() => { delete process.env.WRAITH_LIVE; delete process.env.ANTHROPIC_API_KEY })

test('whats_new for an escort: open loads from the last day in the states they cover, never blocked or their own', async () => {
  const r = await run('whats_new')
  expect(r.data.kind).toBe('new_loads')
  expect(r.data.newOpenLoads).toBe(1)
  expect(r.data.loads[0]).toMatchObject({ id: L1, from: 'Dallas, TX', to: 'Tulsa, OK' })
  expect(r.json).not.toMatch(/@|555-|phone|email|carrier_id/)
  expect(r.links).toEqual([{ label: 'Dallas, TX to Tulsa, OK', href: `/loads/${L1}` }])
  getDb().tables.escort_availability = [{ escort_id: ME, location_state: 'NV' }] // a second state from the availability table counts too
  expect((await run('whats_new')).data.newOpenLoads).toBe(2)
})

test('whats_new for a carrier: new bids today on their own loads only', async () => {
  getDb().tables.bids = [
    { id: 'b1', load_id: L1, escort_id: E1, rate: 400, created_at: hoursAgo(1) },
    { id: 'b2', load_id: L1, escort_id: E2, rate: 380, created_at: hoursAgo(2) },
    { id: 'b3', load_id: L1, escort_id: E2, rate: 100, created_at: hoursAgo(40) }, // too old
    { id: 'b4', load_id: L5, escort_id: E1, rate: 999, created_at: hoursAgo(1) },   // someone else's load
  ]
  const r = await run('whats_new', {}, POSTER)
  expect(r.data).toMatchObject({ kind: 'new_bids', newBidsToday: 2 })
  expect(r.data.loads).toEqual([{ route: 'Dallas, TX to Tulsa, OK', newBids: 2, lowest: '380 dollars' }])
  expect(r.json).not.toMatch(/Dana|Marcus|555-|@/)
})

test('my_fleet: only the manager\'s own escorts, free versus on a job, names only', async () => {
  const MGR = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  getDb().tables.profiles.push({ id: MGR, role: 'fleet_manager' })
  getDb().tables.fleet_escorts = [{ fleet_manager_id: MGR, escort_id: E1 }, { fleet_manager_id: MGR, escort_id: E2 }, { fleet_manager_id: POSTER, escort_id: ME }]
  getDb().tables.loads.push({ id: 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', carrier_id: POSTER, matched_escort_id: E2, status: 'filled', pu_city: 'Tulsa', pu_state: 'OK', dl_city: 'Enid', dl_state: 'OK' })
  const r = await run('my_fleet', {}, MGR)
  expect(r.data).toMatchObject({ escorts: 2, onAJob: 1, free: 1, freeEscorts: ['Dana Free'] })
  expect(r.data.onJobs).toEqual([{ name: 'Marcus Busy', route: 'Tulsa, OK to Enid, OK', status: 'filled' }])
  expect(r.json).not.toMatch(/@|555-|phone|email/)
  expect((await run('my_fleet', {}, ME)).data).toMatchObject({ escorts: 0 }) // someone with no fleet sees nothing, and never another manager's escorts
})

test('prepare_bid: a button for the escort to confirm, never a bid; every bad case is refused', async () => {
  const before = JSON.stringify(getDb().tables)
  const ok = await run('prepare_bid', { load_id: L1, amount: 420 })
  expect(ok.data.ok).toBe(true)
  expect(ok.links).toEqual([{ label: 'Review $420 bid: Dallas, TX to Tulsa, OK', href: `/loads/${L1}?bid=420` }])
  expect((await run('prepare_bid', { load_id: L1, amount: 412.5 })).links[0].href).toBe(`/loads/${L1}?bid=412.50`)
  expect(JSON.stringify(getDb().tables)).toBe(before) // nothing was written anywhere
  for (const bad of [{ load_id: 'x', amount: 5 }, { load_id: L1, amount: 0 }, { load_id: L1, amount: -5 }, { load_id: L1, amount: 1e9 }, { load_id: L1, amount: 'abc' }, { load_id: L5, amount: 400 } /* own load */, { load_id: L4, amount: 400 } /* blocked poster */, { load_id: '99999999-9999-4999-8999-999999999999', amount: 400 }]) {
    const r = await run('prepare_bid', bad)
    expect(r.data.ok, JSON.stringify(bad)).toBe(false); expect(r.links).toEqual([])
  }
  getDb().tables.loads[0].expires_at = hoursAgo(1)
  expect((await run('prepare_bid', { load_id: L1, amount: 400 })).data.ok).toBe(false)
  getDb().tables.loads[0].expires_at = future; getDb().tables.loads[0].status = 'filled'
  expect((await run('prepare_bid', { load_id: L1, amount: 400 })).data.ok).toBe(false)
  expect((await run('prepare_bid', { load_id: L1, amount: 400 }, POSTER)).data.ok).toBe(false) // a carrier cannot bid
})

test('prepare_claim opens the load for review and refuses what prepare_bid refuses', async () => {
  const r = await run('prepare_claim', { load_id: L1 })
  expect(r.links).toEqual([{ label: 'Review and claim: Dallas, TX to Tulsa, OK', href: `/loads/${L1}` }])
  expect((await run('prepare_claim', { load_id: L4 })).data.ok).toBe(false)
  expect((await run('prepare_claim', { load_id: L1 }, POSTER)).data.ok).toBe(false)
})

test('through the route: the confirm button comes first and the model cannot add its own link', async () => {
  let n = 0
  m.reply = () => { n++; if (n === 1) return tool('search_open_loads', { state: 'TX' }); if (n === 2) return tool('prepare_bid', { load_id: L1, amount: 420 }); return say("I've put the button on screen. Check it and tap to confirm. https://evil.example") }
  const res = await POST(new NextRequest('http://localhost/api/wraith', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'bid 420 on the Dallas load' }] }) }))
  const d = await res.json()
  expect(d.links[0]).toEqual({ label: 'Review $420 bid: Dallas, TX to Tulsa, OK', href: `/loads/${L1}?bid=420` })
  expect(d.links.every((l: { href: string }) => l.href.startsWith('/loads/'))).toBe(true)
  expect(d.links.length).toBeLessThanOrEqual(4)
  expect(d.reply).not.toMatch(/evil/)
})

test('the load page only fills the bid box from the link; it never submits', () => {
  const page = fs.readFileSync('app/loads/[id]/page.tsx', 'utf8')
  expect(page).toMatch(/get\('bid'\)/)
  expect(page).toMatch(/\^\\d\{1,6\}\(\\\.\\d\{1,2\}\)\?\$/)
  expect(page.match(/setBidRate\(preBid\)/g)).toHaveLength(1)
  expect(fs.readFileSync('lib/wraith.ts', 'utf8')).not.toMatch(/\.(insert|update|delete|upsert)\(/)
})
