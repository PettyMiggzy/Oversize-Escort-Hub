import { beforeEach, expect, test } from 'vitest'
import { getDb, resetHostile } from './mock-client'
import { GET } from '@/app/api/admin/funnel/route'

function ago(days: number, inside: boolean) {
  const skew = inside ? -60_000 : 60_000
  return new Date(Date.now() - days * 86400000 + skew).toISOString()
}

beforeEach(() => {
  resetHostile()
  getDb().tables.profiles = [
    { id: 'e1', role: 'escort', created_at: ago(0, true), state: 'TX', bgc_verified: true, pevo_verified: false, p_evo_verified: false, email: 'e1@example.com', phone: '8085550101', full_name: 'Ada Escort' },
    { id: 'e2', role: 'escort', created_at: ago(10, true), state: '  ', bgc_verified: false, pevo_verified: false, p_evo_verified: true, email: 'e2@example.com', phone: '8085550102' },
    { id: 'c1', role: 'carrier', created_at: ago(40, false), state: null, bgc_verified: false, email: 'c1@example.com', phone: '8085550103' },
    { id: 'b1', role: 'broker', created_at: ago(1, true), state: 'ON', email: 'b1@example.com', phone: '8085550104' },
    { id: 'f1', role: 'fleet_manager', created_at: ago(3, true), state: '', email: 'f1@example.com', phone: '8085550105' },
    { id: 'a1', role: 'admin', created_at: ago(0, true), state: 'WA', email: 'admin@example.com', phone: '8085550199', full_name: 'Admin Person' },
  ]
  getDb().tables.loads = [
    { id: 'open-new', status: 'open', created_at: ago(1, true) },
    { id: 'filled-mid', status: 'filled', created_at: ago(10, true) },
    { id: 'open-old', status: 'open', created_at: ago(40, false) },
    { id: 'expired-new', status: 'expired', created_at: ago(2, true) },
  ]
  getDb().tables.bids = [
    { id: 'bid1', load_id: 'open-new', escort_id: 'e1' },
    { id: 'bid2', load_id: 'open-new', escort_id: 'e2' },
    { id: 'bid3', load_id: 'filled-mid', escort_id: 'e1' },
  ]
})

test('funnel route refuses a signed-out caller', async () => {
  getDb().sessionUser = null
  const res = await GET()
  expect(res.status).toBe(401)
})

test('funnel route refuses a non-admin', async () => {
  getDb().sessionUser = { id: 'e1', email: 'e1@example.com' }
  const res = await GET()
  expect(res.status).toBe(403)
  const body = await res.json()
  expect(JSON.stringify(body)).not.toContain('e1@example.com')
  expect(JSON.stringify(body)).not.toContain('8085550101')
  expect(JSON.stringify(body)).not.toContain('Ada')
})

test('funnel route returns only numbers for an admin', async () => {
  getDb().sessionUser = { id: 'a1', email: 'admin@example.com' }
  const res = await GET()
  expect(res.status).toBe(200)
  const body = await res.json()
  for (const value of Object.values(body)) expect(typeof value).toBe('number')
  const raw = JSON.stringify(body)
  expect(raw).not.toContain('@')
  expect(raw).not.toContain('808555')
  expect(raw).not.toContain('Ada')
  expect(raw).not.toContain('Admin Person')
  expect(body).toEqual({
    signupsTotal: 6,
    signups7: 4,
    signups30: 5,
    roleEscort: 2,
    roleCarrier: 1,
    roleBroker: 1,
    roleFleetManager: 1,
    withState: 3,
    withBgc: 1,
    withPevo: 1,
    loadsTotal: 4,
    loads7: 2,
    loads30: 3,
    loadsWithBid: 2,
    bidsTotal: 3,
    loadsFilled: 1,
    loadsOpen: 2,
  })
})
