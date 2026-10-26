import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'

const sent: { to: string; subject: string; html: string }[] = []
vi.mock('@/lib/email', () => ({ sendEmail: async (e: { to: string; subject: string; html: string }) => { sent.push(e); return true } }))
import { GET as cron } from '@/app/api/cron/expire-loads/route'
import { POST as checkin } from '@/app/api/loads/checkin/route'
import { POST as report } from '@/app/api/loads/report/route'
import { loadCheckToken, verifyLoadCheckToken, KEEP_FOR_MS, MAX_POST_HOLD_MS } from '@/lib/load-lifecycle'
import { POST as postLoad } from '@/app/api/loads/route'

const H = 3600000
const L = (n: string) => `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${n}`
const ago = (h: number) => new Date(Date.now() - h * H).toISOString()
const ahead = (h: number) => new Date(Date.now() + h * H).toISOString()
const post = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const runCron = () => cron(new Request('http://localhost/api/cron/expire-loads', { headers: { authorization: 'Bearer cron-test-secret' } }))
const load = (over: Record<string, unknown>) => ({ status: 'open', carrier_id: 'poster', board_type: 'flat-rate', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', created_at: ago(1), expires_at: ahead(23), checkin_sent_at: null, ...over })

beforeEach(() => {
  resetHostile(); sent.length = 0
  getDb().tables.profiles = [
    { id: 'poster', role: 'carrier', email: 'boss@fleet.example' },
    { id: 'e1', role: 'escort' }, { id: 'e2', role: 'escort' }, { id: 'b1', role: 'broker' },
  ]
})

test('after 12 hours the poster is asked once; young, bid-board, expired and already-asked loads are not', async () => {
  getDb().tables.loads = [
    load({ id: L('1'), created_at: ago(13) }),
    load({ id: L('2'), created_at: ago(5) }),
    load({ id: L('3'), created_at: ago(13), board_type: 'bid' }),
    load({ id: L('4'), created_at: ago(13), checkin_sent_at: ago(1) }),
    load({ id: L('5'), created_at: ago(30), expires_at: ago(6) }),
  ]
  const r = await (await runCron()).json()
  expect(r.checkins).toBe(1)
  expect(sent).toHaveLength(1)
  expect(sent[0].to).toBe('boss@fleet.example')
  expect(sent[0].html).toContain('/load-check/' + L('1') + '?t=')
  expect(getDb().tables.loads.find((l) => l.id === L('1'))!.checkin_sent_at).toBeTruthy()
  // the next run does not ask again
  await runCron()
  expect(sent).toHaveLength(1)
  expect(getDb().tables.loads.find((l) => l.id === L('5'))!.status).toBe('expired')
})

test('a post with no expiry stops at a day; a relisted load is asked 12 hours after it went back up', async () => {
  getDb().tables.loads = [
    load({ id: L('1'), expires_at: null, created_at: ago(25) }),
    load({ id: L('2'), expires_at: null, created_at: ago(5) }),
    load({ id: L('3'), created_at: ago(40), relisted_at: ago(2), expires_at: ahead(22) }),
  ]
  await runCron()
  const by = (n: string) => getDb().tables.loads.find((l) => l.id === L(n))!
  expect(by('1').status).toBe('expired')
  expect(by('2').status).toBe('open')
  expect(by('3').checkin_sent_at).toBeNull()
  expect(sent).toHaveLength(0)
})

test('the link token: valid for its load for three days, never for another load, never tampered', () => {
  const t = loadCheckToken(L('1'))
  expect(verifyLoadCheckToken(L('1'), t)).toBe(true)
  expect(verifyLoadCheckToken(L('2'), t)).toBe(false)
  expect(verifyLoadCheckToken(L('1'), t.slice(0, -2) + 'zz')).toBe(false)
  expect(verifyLoadCheckToken(L('1'), loadCheckToken(L('1'), Date.now() - 4 * 86400000))).toBe(false)
  expect(verifyLoadCheckToken(L('1'), undefined)).toBe(false)
  expect(verifyLoadCheckToken(L('1'), 'abc')).toBe(false)
})

test('keep it up extends 24 hours and resets the check-in; take it down closes; bad tokens and finished loads are refused', async () => {
  getDb().tables.loads = [load({ id: L('1'), created_at: ago(13), checkin_sent_at: ago(1), expires_at: ahead(10) }), load({ id: L('2'), status: 'filled' }), load({ id: L('3'), status: 'cancelled' })]
  const t = (n: string) => loadCheckToken(L(n))
  expect((await checkin(post('/api/loads/checkin', { loadId: L('1'), token: 'bad', action: 'keep' }))).status).toBe(403)
  expect((await checkin(post('/api/loads/checkin', { loadId: L('1'), token: t('1'), action: 'nuke' }))).status).toBe(403)
  expect((await checkin(post('/api/loads/checkin', { loadId: L('1'), token: t('1'), action: 'keep' }))).status).toBe(200)
  const kept = getDb().tables.loads[0]
  expect(Date.parse(kept.expires_at as string)).toBeGreaterThan(Date.now() + KEEP_FOR_MS - 60000)
  expect(kept.checkin_sent_at).toBeNull()
  expect(kept.relisted_at).toBeTruthy()
  // a load escorts did not flag, closed by someone else (admin or spam guard), cannot be revived from the email
  expect((await checkin(post('/api/loads/checkin', { loadId: L('3'), token: t('3'), action: 'keep' }))).status).toBe(409)
  // a filled load stays filled
  expect((await checkin(post('/api/loads/checkin', { loadId: L('2'), token: t('2'), action: 'close' }))).status).toBe(200)
  expect(getDb().tables.loads[1].status).toBe('filled')
  expect((await checkin(post('/api/loads/checkin', { loadId: L('1'), token: t('1'), action: 'close' }))).status).toBe(200)
  expect(getDb().tables.loads[0].status).toBe('cancelled')
})

test('two different escorts saying "taken" take the load off the board and tell the poster; a broker, the poster or one escort twice do not', async () => {
  getDb().tables.loads = [load({ id: L('1') })]
  const say = (id: string) => { getDb().sessionUser = { id, email: `${id}@x.example` }; return report(post('/api/loads/report', { loadId: L('1'), reason: 'taken' })) }
  expect((await (await say('e1')).json()).taken).toBe(false)
  expect((await (await say('e1')).json()).taken).toBe(false)
  expect((await (await say('b1')).json()).taken).toBe(false)
  expect(getDb().tables.loads[0].status).toBe('open')
  expect((await say('poster')).status).toBe(400)
  expect((await (await say('e2')).json()).taken).toBe(true)
  expect(getDb().tables.loads[0]).toMatchObject({ status: 'cancelled' })
  expect(getDb().tables.loads[0].taken_flagged_at).toBeTruthy()
  expect(sent.map((e) => e.to)).toEqual(['boss@fleet.example'])
  expect(sent[0].subject).toMatch(/taken off the board/)
  // one tap from the email puts it back, and old "taken" reports do not take it down again
  expect((await checkin(post('/api/loads/checkin', { loadId: L('1'), token: loadCheckToken(L('1')), action: 'keep' }))).status).toBe(200)
  expect(getDb().tables.loads[0].status).toBe('open')
  getDb().tables.load_reports.forEach((r) => { r.created_at = ago(1) })
  getDb().tables.loads[0].relisted_at = new Date().toISOString()
  getDb().sessionUser = { id: 'e1', email: 'e1@x.example' }
  await report(post('/api/loads/report', { loadId: L('1'), reason: 'taken' }))
  expect(getDb().tables.loads[0].status).toBe('open')
})

test('"taken" reports never count toward the spam guard or email the admins', async () => {
  getDb().tables.loads = [load({ id: L('1') })]
  getDb().tables.profiles.push({ id: 'e3', role: 'escort' })
  for (const id of ['e1', 'b1', 'e3']) { getDb().sessionUser = { id, email: `${id}@x.example` }; await report(post('/api/loads/report', { loadId: L('1'), reason: id === 'b1' ? 'taken' : 'taken' })) }
  // e1 + e3 are escorts: that is two, so it came down as taken, not as spam
  expect(getDb().tables.loads[0].taken_flagged_at).toBeTruthy()
  expect(sent.every((e) => e.to === 'boss@fleet.example')).toBe(true)
})

test('a posted load can stay up at most two days', async () => {
  getDb().sessionUser = { id: 'poster', email: 'boss@fleet.example' }
  getDb().tables.profiles[0].tier = 'pro'
  const body = { pickupCity: 'Dallas', pickupState: 'TX', destinationCity: 'Tulsa', destinationState: 'OK', escortType: 'Lead', boardType: 'flat-rate', rate: 2.5, expiresAt: ahead(24 * 10) }
  const r = await postLoad(post('/api/loads', body))
  expect(r.status).toBe(201)
  const row = getDb().tables.loads.find((l) => l.carrier_id === 'poster')!
  expect(Date.parse(row.expires_at as string) - Date.now()).toBeLessThanOrEqual(24 * H + 60000)
  expect(MAX_POST_HOLD_MS).toBe(48 * H)
})
