import { beforeEach, expect, test, vi } from 'vitest'
import { getDb, resetHostile } from './mock-client'

const sent: Array<{ to: string; subject: string; html: string }> = []
vi.mock('@/lib/email', () => ({ sendEmail: async (m: { to: string; subject: string; html: string }) => { sent.push(m); return true } }))

import { alertEscortsNewLoad, alertCarrierNewBid, unsubToken, verifyUnsubToken } from '@/lib/alerts'

beforeEach(() => {
  resetHostile()
  sent.length = 0
  vi.useFakeTimers()
})

const load = { id: 'l1', carrier_id: 'c1', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', per_mile_rate: 2.5 }

test('a new load emails only escorts who cover its states or have set none, never the poster', async () => {
  const db = getDb()
  db.tables.loads = [load]
  db.tables.profiles = [
    { id: 'e-tx', role: 'escort', email: 'tx@x.com', availability_states: ['TX'], email_alerts: true },
    { id: 'e-none', role: 'escort', email: 'none@x.com', availability_states: [], email_alerts: true },
    { id: 'e-fl', role: 'escort', email: 'fl@x.com', availability_states: ['FL'], email_alerts: true },
    { id: 'c1', role: 'escort', email: 'poster@x.com', availability_states: [], email_alerts: true },
  ]
  const p = alertEscortsNewLoad('l1')
  await vi.runAllTimersAsync()
  await p
  expect(sent.map((m) => m.to).sort()).toEqual(['none@x.com', 'tx@x.com'])
  expect(sent[0].html).toContain('/api/alerts/unsubscribe?u=')
})

test('someone who opted out gets the in-app notice but no email', async () => {
  const db = getDb()
  db.tables.loads = [load]
  db.tables.profiles = [{ id: 'c1', role: 'carrier', email: 'c@x.com', email_alerts: false, suspended: false }]
  await alertCarrierNewBid('l1', 2.75)
  expect(sent).toHaveLength(0)
  expect(db.tables.notifications?.length).toBe(1)
})

test('a suspended account gets nothing', async () => {
  const db = getDb()
  db.tables.loads = [load]
  db.tables.profiles = [{ id: 'c1', role: 'carrier', email: 'c@x.com', email_alerts: true, suspended: true }]
  await alertCarrierNewBid('l1', 2.75)
  expect(sent).toHaveLength(0)
})

test('the unsubscribe token only works for its own account', () => {
  const t = unsubToken('user-a')
  expect(verifyUnsubToken('user-a', t)).toBe(true)
  expect(verifyUnsubToken('user-b', t)).toBe(false)
  expect(verifyUnsubToken('user-a', t.slice(0, -1) + (t.endsWith('0') ? '1' : '0'))).toBe(false)
  expect(verifyUnsubToken('user-a', '')).toBe(false)
})
