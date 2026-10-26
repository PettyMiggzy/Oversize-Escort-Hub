import fs from 'node:fs'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { GET, OPTIONS, POST } from '@/app/api/mcp/route'
import { handleRpc, PROTOCOLS, TOOLS } from '@/lib/mcp'

let n = 0
const call = (body: unknown, ip = `7.7.7.${++n}`) => POST(new NextRequest('http://localhost/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
const rpc = (method: string, params?: unknown, id: number | string = 1) => ({ jsonrpc: '2.0', id, method, params })
const tool = async (name: string, args: unknown = {}) => (await (await call(rpc('tools/call', { name, arguments: args }))).json()).result

const old = new Date(Date.now() - 3600000).toISOString()
beforeEach(() => {
  resetHostile()
  getDb().tables.profiles = [
    { id: 'e1', role: 'escort', full_name: 'Ann Escort', email: 'ann@x.example', phone: '555-0100', tier: 'pro', bgc_verified: true, pevo_verified: true, availability_states: ['TX'], states_licensed: ['OK'], suspended: false },
    { id: 'e2', role: 'escort', full_name: 'Bob Escort', email: 'bob@x.example', phone: '555-0101', tier: 'free', availability_states: ['TX'], states_licensed: [], suspended: null },
    { id: 'e3', role: 'escort', full_name: 'Sus Pended', availability_states: ['TX'], suspended: true },
    { id: 'c1', role: 'carrier', full_name: 'Carrier', availability_states: ['TX'] },
  ]
  const open = { status: 'open', board_type: 'flat-rate', escort_type: 'Lead', per_mile_rate: 2.5, created_at: old, expires_at: new Date(Date.now() + 3600000).toISOString(), carrier_id: 'c1', poster_company: 'SecretCo', notes: 'call 555-0100', cert_types: ['P/EVO'] }
  getDb().tables.loads = [
    { ...open, id: 'l1', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK' },
    { ...open, id: 'l2', pu_city: 'Fresno', pu_state: 'CA', dl_city: 'Reno', dl_state: 'NV' },
    { ...open, id: 'new', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', created_at: new Date().toISOString() },
    { ...open, id: 'held', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', deadhead_notified_at: new Date().toISOString() },
    { ...open, id: 'exp', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', expires_at: old },
    { ...open, id: 'filled', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', status: 'filled' },
    { ...open, id: 'qp', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', source: 'quick_post', reviewed_at: null },
    { ...open, id: 'past', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', start_date: '2026-03-31' },
    { ...open, id: 'ancient', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', expires_at: null, created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
    { ...open, id: 'qp-ok', pu_city: 'Q', pu_state: 'TX', dl_city: 'R', dl_state: 'OK', source: 'quick_post', reviewed_at: old },
  ]
})

test('handshake: negotiates the protocol, lists five read-only tools, answers ping, stays silent for notifications', async () => {
  const init = await (await call(rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '1' } }))).json()
  expect(init.result.protocolVersion).toBe('2025-03-26')
  expect(init.result.serverInfo.name).toBe('oversize-escort-hub')
  expect(init.result.capabilities.tools).toBeTruthy()
  expect((await (await call(rpc('initialize', { protocolVersion: '1999-01-01' }))).json()).result.protocolVersion).toBe(PROTOCOLS[0])
  const list = await (await call(rpc('tools/list'))).json()
  expect(list.result.tools.map((t: { name: string }) => t.name).sort()).toEqual(['find_pilot_car_escorts', 'get_pilot_car_guide', 'get_site_facts', 'search_open_jobs', 'search_open_loads'])
  for (const t of TOOLS) { expect(t.annotations.readOnlyHint).toBe(true); expect(t.annotations.destructiveHint).toBe(false); expect(t.inputSchema.type).toBe('object') }
  expect((await (await call(rpc('ping'))).json()).result).toEqual({})
  const note = await call({ jsonrpc: '2.0', method: 'notifications/initialized' })
  expect(note.status).toBe(202)
})

test('bad input gets proper JSON-RPC errors, never a crash', async () => {
  expect((await (await call('{nope')).json()).error.code).toBe(-32700)
  expect((await (await call(rpc('does/not/exist'))).json()).error.code).toBe(-32601)
  expect((await (await call(rpc('tools/call', { name: 'delete_everything' }))).json()).error.code).toBe(-32602)
  expect((await (await call([1, 2])).json())[0].error.code).toBe(-32600)
  expect((await call([])).status).toBe(400)
  expect((await call(Array.from({ length: 11 }, (_, i) => rpc('ping', undefined, i + 1)))).status).toBe(400)
  expect((await call('x'.repeat(30000))).status).toBe(413)
  const batch = await (await call([rpc('ping', undefined, 1), rpc('tools/list', undefined, 2), { jsonrpc: '2.0', method: 'notifications/initialized' }])).json()
  expect(batch.map((r: { id: number }) => r.id)).toEqual([1, 2])
  expect(await handleRpc({ jsonrpc: '2.0', id: 5, result: {} })).toBe(null)
  expect(GET().status).toBe(405)
  expect(OPTIONS().status).toBe(204)
})

test('the guide tool returns the sourced text, a section, or a clear error', async () => {
  const all = await tool('get_pilot_car_guide')
  expect(all.content[0].text).toContain('ops.fhwa.dot.gov')
  expect(all.content[0].text).toMatch(/confirm with the state/i)
  expect((await tool('get_pilot_car_guide', { section: 'insurance' })).content[0].text).toContain('## Insurance')
  const none = await tool('get_pilot_car_guide', { section: 'nope' })
  expect(none.isError).toBe(true)
  expect((await tool('get_site_facts')).content[0].text).toMatch(/free while we launch/i)
})

test('escorts by state: public fields only, no suspended, no non-escorts, bad codes refused, limit honoured', async () => {
  const r = await tool('find_pilot_car_escorts', { state: 'tx' })
  const names = r.structuredContent.escorts.map((e: { name: string }) => e.name)
  expect(names).toEqual(['Ann Escort', 'Bob Escort'])
  const blob = JSON.stringify(r)
  expect(blob).not.toMatch(/ann@x|bob@x|555-01|Sus Pended|Carrier/)
  expect(r.structuredContent.escorts[0]).toMatchObject({ pro_member: true, profile: 'https://www.oversize-escort-hub.com/escorts/e1' })
  // no verification claims in what an AI assistant is told
  expect(JSON.stringify(r)).not.toMatch(/badge|verified|background/i)
  expect((await tool('find_pilot_car_escorts', { state: 'OK' })).structuredContent.escorts.map((e: { name: string }) => e.name)).toEqual(['Ann Escort'])
  expect((await tool('find_pilot_car_escorts', { state: 'TX', limit: 1 })).structuredContent.escorts).toHaveLength(1)
  expect((await tool('find_pilot_car_escorts', { state: 'ZZ' })).isError).toBe(true)
  expect((await tool('find_pilot_car_escorts', {})).isError).toBe(true)
  expect((await tool('find_pilot_car_escorts', { state: 'WY' })).content[0].text).toMatch(/No escorts list Wyoming/)
})

test('open loads follow the public rules and never show who posted them or their notes', async () => {
  const r = await tool('search_open_loads', {})
  const ids = r.structuredContent.loads.map((l: { link: string }) => l.link.split('/').pop()).sort()
  expect(ids).toEqual(['l1', 'l2', 'qp-ok'])
  const blob = JSON.stringify(r)
  expect(blob).not.toMatch(/SecretCo|555-0100|carrier_id|c1/)
  expect((await tool('search_open_loads', { state: 'nv' })).structuredContent.loads).toHaveLength(1)
  expect((await tool('search_open_loads', { state: 'ZZ' })).isError).toBe(true)
  expect((await tool('search_open_loads', { state: 'TX', limit: 1 })).structuredContent.loads).toHaveLength(1)
  getDb().tables.loads = []
  expect((await tool('search_open_loads')).content[0].text).toMatch(/No open loads/)
})

test('a caller that hammers the endpoint is slowed down; the source selects no contact columns', async () => {
  let last = 200
  for (let i = 0; i < 62; i++) last = (await call(rpc('ping'), '66.66.66.66')).status
  expect(last).toBe(429)
  const src = fs.readFileSync('lib/mcp.ts', 'utf8')
  expect(src).not.toMatch(/\.select\('[^']*\b(email|phone|notes|poster_company|carrier_id)\b/)
})

test('open jobs: only open, unexpired jobs, state filter, plain-words labels, no poster id', async () => {
  const future = new Date(Date.now() + 86400000).toISOString()
  const j = { status: 'open', expires_at: future, company: 'Lone Star Pilot Cars', classification: '1099', equipment: 'bring_own', pay_model: 'percent', pay_min: 30, pay_max: 30, schedule: 'full_time', travel: 'regional', poster_id: 'secret-poster', states: ['TX'] }
  getDb().tables.job_posts = [
    { ...j, id: 'j1', title: 'Lead escort TX', base_city: 'Dallas', base_state: 'TX' },
    { ...j, id: 'j2', title: 'Chase OK', base_city: 'Tulsa', base_state: 'OK', states: ['OK'] },
    { ...j, id: 'j3', title: 'Closed one', base_state: 'TX', status: 'closed' },
    { ...j, id: 'j4', title: 'Expired one', base_state: 'TX', expires_at: old },
  ]
  const all = await tool('search_open_jobs')
  expect(all.structuredContent.jobs.map((x: { title: string }) => x.title).sort()).toEqual(['Chase OK', 'Lead escort TX'])
  expect(JSON.stringify(all)).not.toMatch(/secret-poster|poster_id/)
  expect(all.structuredContent.jobs.find((x: { title: string }) => x.title === 'Lead escort TX')).toMatchObject({ pay: '30% of the load', work_type: 'Independent contractor (1099)', link: 'https://www.oversize-escort-hub.com/jobs/j1' })
  expect((await tool('search_open_jobs', { state: 'ok' })).structuredContent.jobs).toHaveLength(1)
  expect((await tool('search_open_jobs', { state: 'ZZ' })).isError).toBe(true)
  getDb().tables.job_posts = []
  expect((await tool('search_open_jobs')).content[0].text).toMatch(/No open jobs/)
})

test('the registry listing fits the registry rules (description at most 100 characters)', () => {
  const d = JSON.parse(fs.readFileSync('docs/mcp-registry/server.json', 'utf8'))
  expect(d.description.length).toBeLessThanOrEqual(100)
})
