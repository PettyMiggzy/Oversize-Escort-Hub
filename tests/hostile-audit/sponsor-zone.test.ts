import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'
import { POST as checkout } from '@/app/api/checkout/route'

function buy(zone: string) {
  return checkout(new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ priceId: STRIPE_PRICE_IDS.SPONSORED_ZONE, zone }),
  }))
}

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: 'buyer', email: 'buyer@example.com' }
  getDb().tables.profiles = [{ id: 'buyer', role: 'escort', tier: 'free', email: 'buyer@example.com' }]
})

test('a state that already has a live sponsor is refused before any money is taken', async () => {
  const future = new Date(Date.now() + 10 * 86400000).toISOString()
  getDb().tables.sponsored_zones = [{ id: 'z1', user_id: 'other', zone: 'IN', active: true, expires_at: future }]
  const res = await buy('in')
  expect(res.status).toBe(409)
  expect(String((await res.json()).error)).toMatch(/already has a sponsor/i)
})

test('an expired sponsor does not hold the state', async () => {
  const past = new Date(Date.now() - 86400000).toISOString()
  getDb().tables.sponsored_zones = [{ id: 'z1', user_id: 'other', zone: 'IN', active: true, expires_at: past }]
  const res = await buy('in')
  expect(res.status).not.toBe(409)
})
