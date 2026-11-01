import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { serviceClient } from '@/lib/service-client'
import { POST as postLoad } from '@/app/api/loads/route'
import { POST as claim } from '@/app/api/loads/request/route'
import { POST as placeBid } from '@/app/api/bids/route'
import { POST as regulars, GET as listRegulars } from '@/app/api/regulars/route'
import { POST as saveEquipment, GET as getEquipment } from '@/app/api/equipment/route'
import { POST as makeUrgent } from '@/app/api/loads/urgent/route'
import { POST as review } from '@/app/api/reviews/route'
import { sendDeferredLoadAlerts } from '@/lib/alerts'
import { typicalRates } from '@/lib/rates'
import { runWraithTool } from '@/lib/wraith'
import { cleanEquipment, cleanTags, missingEquipment, regularsMinutes, regularsOpen } from '@/lib/quality'

const root = path.resolve(__dirname, '../..')
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8')
const jreq = (url: string, body: unknown) => new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })
const ahead = (min: number) => new Date(Date.now() + min * 60000).toISOString()
const OLD = new Date(Date.now() - 600_000).toISOString()

const CARRIER = 'carrier-1', REG = 'escort-regular', OTHER = 'escort-other'
function seed() {
  const db = getDb()
  db.tables.profiles = [
    { id: CARRIER, role: 'carrier', tier: 'pro', suspended: false, email: 'c@example.com', full_name: 'Carrier Co' },
    { id: REG, role: 'escort', tier: 'pro', suspended: false, equipment: ['light_bar', 'cb_radio'], email: 'ray@example.com', full_name: 'Ray M.', avg_rating: 4.9, review_count: 8, total_jobs: 8, availability_states: ['TX'] },
    { id: OTHER, role: 'escort', tier: 'pro', suspended: false, equipment: [], email: 'sam@example.com', full_name: 'Sam K.', avg_rating: 4.1, review_count: 3, total_jobs: 3, availability_states: ['TX'] },
  ]
  db.tables.favorite_escorts = [{ carrier_id: CARRIER, escort_id: REG }]
  return db
}
const loadRow = (extra: Record<string, unknown> = {}) => ({ id: 'load-1', status: 'open', board_type: 'flat-rate', carrier_id: CARRIER, created_at: OLD, expires_at: ahead(600), deadhead_notified_at: null, pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', per_mile_rate: 1.9, ...extra })

beforeEach(() => { resetHostile() })

// ---------- the small rules ----------
test('equipment lists keep only known items, and a load asking for equipment is checked against the list', () => {
  expect(cleanEquipment(['light_bar', 'light_bar', 'jetpack', 5, 'cb_radio'])).toEqual(['light_bar', 'cb_radio'])
  expect(cleanEquipment('light_bar')).toEqual([])
  expect(missingEquipment(['light_bar', 'height_pole', 'jetpack'], ['light_bar'])).toEqual(['height_pole'])
  expect(regularsMinutes(10)).toBe(10); expect(regularsMinutes(7)).toBe(0); expect(regularsMinutes('30')).toBe(30)
  expect(regularsOpen(ahead(5))).toBe(true); expect(regularsOpen(OLD)).toBe(false); expect(regularsOpen(null)).toBe(false)
  expect(cleanTags(['on_time', 'paid_on_time', 'nope'], 'escort')).toEqual(['on_time'])
  expect(cleanTags(['on_time', 'paid_on_time', 'nope'], 'carrier')).toEqual(['paid_on_time'])
})

// ---------- posting ----------
test('posting a load saves urgent, required equipment (known items only) and a regulars-first window; no regulars means no window; the 5-minute board never has one', async () => {
  const db = seed()
  db.sessionUser = { id: CARRIER, email: 'c@example.com' }
  const body = { pickupCity: 'Dallas', pickupState: 'TX', destinationCity: 'Tulsa', destinationState: 'OK', escortType: 'Lead', boardType: 'flat-rate', rate: 1.9, urgent: true, required_equipment: ['light_bar', 'jetpack'], regulars_minutes: 10 }
  const res = await postLoad(jreq('http://x/api/loads', body))
  expect(res.status).toBe(201)
  const row = db.tables.loads[0] as any
  expect(row.urgent).toBe(true)
  expect(row.required_equipment).toEqual(['light_bar'])
  expect(row.alerts_pending).toBe(true)
  const mins = (Date.parse(row.regulars_until) - Date.now()) / 60000
  expect(mins).toBeGreaterThan(9); expect(mins).toBeLessThanOrEqual(10)

  // a bid-board load never waits for regulars
  const bid = await postLoad(jreq('http://x/api/loads', { ...body, boardType: 'bid' }))
  expect(bid.status).toBe(201)
  expect((db.tables.loads[1] as any).regulars_until).toBeNull()

  // a carrier with no regulars cannot open a window
  db.tables.favorite_escorts = []
  await postLoad(jreq('http://x/api/loads', body))
  const last = db.tables.loads[2] as any
  expect(last.regulars_until).toBeNull(); expect(last.alerts_pending).toBe(false)
})

// ---------- claims and bids ----------
test('regulars have first look: others are refused on the server while the window runs, regulars and everyone after it are not', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ regulars_until: ahead(8) })]
  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  const refused = await claim(jreq('http://x/api/loads/request', { load_id: 'load-1' }))
  expect(refused.status).toBe(403)
  expect((await refused.json()).error).toMatch(/regulars have first look/)
  expect((db.tables.loads[0] as any).status).toBe('open')

  db.sessionUser = { id: REG, email: 'r@example.com' }
  expect((await claim(jreq('http://x/api/loads/request', { load_id: 'load-1' }))).status).toBe(200)

  // window over: anyone may claim
  db.tables.loads = [loadRow({ regulars_until: OLD })]
  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  expect((await claim(jreq('http://x/api/loads/request', { load_id: 'load-1' }))).status).toBe(200)
})

test('a load that needs equipment refuses an escort who has not listed it, on claims and on bids', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ required_equipment: ['light_bar', 'height_pole'] }), loadRow({ id: 'load-2', board_type: 'bid', required_equipment: ['cb_radio'] })]
  db.sessionUser = { id: REG, email: 'r@example.com' }
  const noPole = await claim(jreq('http://x/api/loads/request', { load_id: 'load-1' }))
  expect(noPole.status).toBe(403)
  expect((await noPole.json()).error).toMatch(/Height pole/)
  // Ray lists a pole and can claim
  ;(db.tables.profiles.find((p) => p.id === REG) as any).equipment = ['light_bar', 'cb_radio', 'height_pole']
  expect((await claim(jreq('http://x/api/loads/request', { load_id: 'load-1' }))).status).toBe(200)

  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  const noCb = await placeBid(jreq('http://x/api/bids', { load_id: 'load-2', rate: 2 }))
  expect(noCb.status).toBe(403)
  expect((await noCb.json()).error).toMatch(/CB radio/)
  db.sessionUser = { id: REG, email: 'r@example.com' }
  expect((await placeBid(jreq('http://x/api/bids', { load_id: 'load-2', rate: 2 }))).status).toBe(200)
})

test('unknown items in a load requirement never lock everyone out', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ required_equipment: ['jetpack'] })]
  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  expect((await claim(jreq('http://x/api/loads/request', { load_id: 'load-1' }))).status).toBe(200)
})

// ---------- regulars ----------
test('regulars: carriers add and remove, escorts cannot, self and blocked and non-escorts are refused, and there is a cap', async () => {
  const db = seed()
  db.tables.favorite_escorts = []
  db.sessionUser = { id: CARRIER, email: 'c@example.com' }
  const REG_UUID = '00000000-0000-4000-8000-0000000000aa', SELF = '00000000-0000-4000-8000-0000000000bb'
  db.tables.profiles.push({ id: REG_UUID, role: 'escort', suspended: false, full_name: 'Lee', equipment: [] })
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: REG_UUID, on: true }))).status).toBe(200)
  expect(db.tables.favorite_escorts).toHaveLength(1)
  const list = await (await listRegulars()).json()
  expect(list.regulars.map((r: any) => r.escort_id)).toEqual([REG_UUID])
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: REG_UUID, on: false }))).status).toBe(200)
  expect(db.tables.favorite_escorts).toHaveLength(0)
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: 'not-an-id', on: true }))).status).toBe(400)
  // a carrier is not an escort
  db.tables.profiles.push({ id: SELF, role: 'carrier', suspended: false })
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: SELF, on: true }))).status).toBe(404)
  // an escort cannot keep regulars
  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: REG_UUID, on: true }))).status).toBe(403)
  // blocked either way
  db.sessionUser = { id: CARRIER, email: 'c@example.com' }
  db.tables.user_blocks = [{ blocker_id: REG_UUID, blocked_id: CARRIER }]
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: REG_UUID, on: true }))).status).toBe(403)
  // the cap
  db.tables.user_blocks = []
  db.tables.favorite_escorts = Array.from({ length: 50 }, (_, i) => ({ carrier_id: CARRIER, escort_id: `x${i}` }))
  expect((await regulars(jreq('http://x/api/regulars', { escort_id: REG_UUID, on: true }))).status).toBe(409)
})

// ---------- equipment ----------
test('an escort lists their rig (known items only); carriers cannot', async () => {
  const db = seed()
  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  const res = await saveEquipment(jreq('http://x/api/equipment', { equipment: ['cb_radio', 'laser_cannon', 'paddle', 'paddle'] }))
  expect(res.status).toBe(200)
  expect((db.tables.profiles.find((p) => p.id === OTHER) as any).equipment).toEqual(['cb_radio', 'paddle'])
  const got = await (await getEquipment()).json()
  expect(got.canEdit).toBe(true); expect(got.equipment).toEqual(['cb_radio', 'paddle'])
  db.sessionUser = { id: CARRIER, email: 'c@example.com' }
  expect((await saveEquipment(jreq('http://x/api/equipment', { equipment: ['cb_radio'] }))).status).toBe(403)
  expect((await (await getEquipment()).json()).canEdit).toBe(false)
})

// ---------- urgent and replacement ----------
const F1 = '00000000-0000-4000-8000-0000000000f1', O1 = '00000000-0000-4000-8000-0000000000a1'
test('urgent: only the poster can mark it; a cancelled escort can be replaced in one tap, the old escort is told, regulars get a short first look', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ id: F1, status: 'filled', matched_escort_id: OTHER }), loadRow({ id: O1 })]
  db.sessionUser = { id: OTHER, email: 'o@example.com' }
  expect((await makeUrgent(jreq('http://x/api/loads/urgent', { load_id: O1 }))).status).toBe(403)

  db.sessionUser = { id: CARRIER, email: 'c@example.com' }
  const rep = await makeUrgent(jreq('http://x/api/loads/urgent', { load_id: F1 }))
  expect(rep.status).toBe(200)
  const body = await rep.json()
  expect(body.reopened).toBe(true); expect(body.regulars_minutes).toBe(5)
  const row = db.tables.loads.find((l) => l.id === F1) as any
  expect(row.status).toBe('open'); expect(row.matched_escort_id).toBeNull(); expect(row.urgent).toBe(true)
  expect(row.alerts_pending).toBe(true); expect(regularsOpen(row.regulars_until)).toBe(true)
  expect((db.tables.notifications ?? []).some((n) => n.user_id === OTHER && /reopened/.test(String(n.message)))).toBe(true)

  // an open load: mark urgent once, a second time is refused
  expect((await makeUrgent(jreq('http://x/api/loads/urgent', { load_id: O1 }))).status).toBe(200)
  expect((await makeUrgent(jreq('http://x/api/loads/urgent', { load_id: O1 }))).status).toBe(409)
  expect((await makeUrgent(jreq('http://x/api/loads/urgent', { load_id: 'nope' }))).status).toBe(400)
})

test('alerts that waited for a regulars window go out once the window is over, and only once', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ id: 'wait-1', alerts_pending: true, regulars_until: OLD }), loadRow({ id: 'still-1', alerts_pending: true, regulars_until: ahead(5) })]
  const first = await sendDeferredLoadAlerts(5)
  expect(first.handled).toBe(1)
  expect((db.tables.loads.find((l) => l.id === 'wait-1') as any).alerts_pending).toBe(false)
  expect((db.tables.loads.find((l) => l.id === 'still-1') as any).alerts_pending).toBe(true)
  const sent = (db.tables.notifications ?? []).length
  expect(sent).toBeGreaterThan(0)
  expect((await sendDeferredLoadAlerts(5)).handled).toBe(0)
  expect((db.tables.notifications ?? []).length).toBe(sent)
})

// ---------- typical rates ----------
test('typical rate: the middle of open loads, needs three, ignores expired ones', async () => {
  const db = seed()
  const mk = (id: string, rate: number, exp = ahead(60), st = 'TX') => ({ id, status: 'open', pu_state: st, per_mile_rate: rate, expires_at: exp })
  db.tables.loads = [mk('a', 1.5), mk('b', 1.8), mk('c', 2.1), mk('d', 2.4), mk('e', 9, OLD), mk('f', 3, ahead(60), 'OK')]
  const tx = await typicalRates(serviceClient(), 'tx')
  expect(tx).toEqual({ state: 'TX', count: 4, median: 1.95, low: 1.5, high: 2.4 })
  expect(await typicalRates(serviceClient(), 'OK')).toBeNull()
  expect((await typicalRates(serviceClient(), null))?.count).toBe(5)
  expect(await typicalRates(serviceClient(), 'ZZZ')).toEqual((await typicalRates(serviceClient(), null)))
})

// ---------- reviews ----------
test('a carrier can review the escort on their load, tags are kept for that side only', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ id: 'done-1', status: 'filled', matched_escort_id: REG })]
  db.sessionUser = { id: CARRIER, email: 'c@example.com' }
  const res = await review(jreq('http://x/api/reviews', { loadId: 'done-1', targetUserId: REG, rating: 5, comment: 'Solid', tags: ['on_time', 'clean_rig', 'paid_on_time', 'bogus'] }))
  expect(res.status).toBe(200)
  const row = db.tables.reviews[0] as any
  expect(row.tags).toEqual(['on_time', 'clean_rig'])
  expect(row.reviewer_role).toBe('carrier')
  // the escort reviewing the carrier gets the carrier list
  db.sessionUser = { id: REG, email: 'r@example.com' }
  await review(jreq('http://x/api/reviews', { loadId: 'done-1', targetUserId: CARRIER, rating: 4, tags: ['on_time', 'fair_rate'] }))
  expect((db.tables.reviews[1] as any).tags).toEqual(['fair_rate'])
})

// ---------- Wraith ----------
test('Wraith find_escorts: carriers only, best reviewed first with their regulars on top, equipment and state filters, no contact details, blocked people left out', async () => {
  const db = seed()
  db.tables.profiles.push({ id: 'escort-third', role: 'escort', suspended: false, full_name: 'Zed Q.', equipment: ['light_bar'], avg_rating: 5, review_count: 20, total_jobs: 30, availability_states: ['TX'], phone: '555', email: 'z@example.com' })
  db.tables.loads = [loadRow({ id: 'old', status: 'filled', matched_escort_id: REG })]
  const all = JSON.parse((await runWraithTool('find_escorts', { state: 'TX', min_rating: 0, equipment: [], regulars_only: false }, CARRIER, serviceClient())).json)
  expect(all.escorts.map((e: any) => e.name)).toEqual(['Ray M.', 'Zed Q.', 'Sam K.'])
  expect(all.escorts[0]).toMatchObject({ yourRegular: true, workedWithYou: 1 })
  expect(JSON.stringify(all)).not.toMatch(/555|@example\.com|phone|email/)
  const withBar = JSON.parse((await runWraithTool('find_escorts', { state: '', min_rating: 4.5, equipment: ['light_bar'], regulars_only: false }, CARRIER, serviceClient())).json)
  expect(withBar.escorts.map((e: any) => e.name)).toEqual(['Ray M.', 'Zed Q.'])
  const regs = JSON.parse((await runWraithTool('find_escorts', { state: '', min_rating: 0, equipment: [], regulars_only: true }, CARRIER, serviceClient())).json)
  expect(regs.escorts.map((e: any) => e.name)).toEqual(['Ray M.'])
  const refused = JSON.parse((await runWraithTool('find_escorts', { state: '', min_rating: 0, equipment: [], regulars_only: false }, OTHER, serviceClient())).json)
  expect(refused.error).toMatch(/Only carriers/)
  db.tables.user_blocks = [{ blocker_id: CARRIER, blocked_id: 'escort-third' }]
  const blocked = JSON.parse((await runWraithTool('find_escorts', { state: '', min_rating: 0, equipment: [], regulars_only: false }, CARRIER, serviceClient())).json)
  expect(blocked.escorts.map((e: any) => e.name)).not.toContain('Zed Q.')
})

test('Wraith typical_rates answers in plain words and says so when there is not enough data', async () => {
  const db = seed()
  db.tables.loads = [loadRow({ id: 'a' }), loadRow({ id: 'b', per_mile_rate: 2.1 }), loadRow({ id: 'c', per_mile_rate: 2.3 })]
  const r = JSON.parse((await runWraithTool('typical_rates', { state: 'TX' }, OTHER, serviceClient())).json)
  expect(r.middle).toBe('2.10 dollars a mile'); expect(r.openLoads).toBe(3)
  const none = JSON.parse((await runWraithTool('typical_rates', { state: 'WY' }, OTHER, serviceClient())).json)
  expect(none.note).toMatch(/Not enough/)
})

// ---------- the screens are wired up ----------
test('the screens use the new pieces', () => {
  for (const f of ['app/flat-rate/_client.tsx', 'app/open-loads/_client.tsx', 'app/bid-board/_client.tsx']) {
    const src = read(f)
    expect(src, f).toContain("from '@/components/LoadBadges'")
    expect(src, f).toMatch(/<LoadBadges load=\{load\} regularOf=\{regularOf\} \/>/)
    expect(src, f).toMatch(/Number\(!!b\.urgent\) - Number\(!!a\.urgent\)/)
  }
  expect(read('app/flat-rate/_client.tsx')).toMatch(/confirmEquipment\(asked\)/)
  expect(read('app/open-loads/_client.tsx')).toMatch(/confirmEquipment\(asked\)/)
  const detail = read('app/loads/[id]/page.tsx')
  expect(detail).toMatch(/Find a replacement now/); expect(detail).toMatch(/\/api\/loads\/urgent/); expect((detail.match(/confirmEquipment\(load\)/g) || []).length).toBe(2)
  const post = read('app/post-load/_client.tsx')
  for (const k of ['urgent,', 'required_equipment: requiredEquip', 'regulars_minutes:', '/api/rates?state=']) expect(post, k).toContain(k)
  expect(read('app/find-escorts/page.tsx')).toMatch(/RegularButton/)
  expect(read('app/find-escorts/page.tsx')).toMatch(/Rig \(listed by the escort, not checked by us\)/)
  expect(read('app/escorts/[id]/page.tsx')).toMatch(/Listed by the escort, not checked by us/)
  expect(read('app/profile/page.tsx')).toContain('<EquipmentEditor />')
  expect(read('app/dashboard/_client.tsx')).toContain('<MyRegulars />')
  const rev = read('app/review/[id]/page.tsx')
  expect(rev).toContain('REVIEW_TAGS'); expect(rev).not.toMatch(/Only escorts can leave a review/)
  expect(read('vercel.json')).toContain('expire-loads')
  expect(read('app/api/cron/expire-loads/route.ts')).toContain('sendDeferredLoadAlerts')
})

test('the new database pieces are in the SQL file and nothing else is touched', () => {
  const sql = read('docs/sql-quality-tools.sql')
  for (const needle of ['urgent boolean', 'required_equipment text[]', 'regulars_until timestamptz', 'alerts_pending boolean', 'equipment text[]', 'tags text[]', 'create table if not exists public.favorite_escorts', 'enable row level security']) expect(sql, needle).toContain(needle)
  expect(sql).not.toMatch(/drop table|delete from|truncate/i)
})
