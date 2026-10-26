import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'
import { POST as webhook } from '@/app/api/webhook/route'

function profile() {
  return getDb().tables.profiles[0]
}

async function postEvent(event: unknown) {
  getDb().stripeEvent = event
  const req = new NextRequest('http://localhost/api/webhook', {
    method: 'POST',
    body: '{}',
    headers: { 'stripe-signature': 'test' },
  })
  return webhook(req)
}

function subscriptionEvent(type: string, status: string, priceId: string, userId = 'user-1') {
  return {
    id: 'evt_' + type + status,
    type,
    data: {
      object: {
        id: 'sub_1',
        object: 'subscription',
        status,
        customer: 'cus_1',
        metadata: { userId, priceId },
        items: { data: [{ price: { id: priceId } }] },
      },
    },
  }
}

beforeEach(() => {
  resetHostile()
  getDb().tables.profiles = [
    {
      id: 'user-1',
      role: 'escort',
      tier: 'free',
      email: 'escort@example.com',
      stripe_subscription_id: null,
      stripe_customer_id: null,
    },
  ]
})

test('canceled subscription.updated does not grant a paid tier', async () => {
  const res = await postEvent(subscriptionEvent('customer.subscription.updated', 'canceled', STRIPE_PRICE_IDS.P_EVO_PRO))
  expect(res.status).toBe(200)
  expect(profile().tier).not.toBe('pro')
  expect(profile().stripe_subscription_id).toBeNull()
})

test('past_due subscription.updated does not grant a paid tier', async () => {
  const res = await postEvent(subscriptionEvent('customer.subscription.updated', 'past_due', STRIPE_PRICE_IDS.P_EVO_PRO))
  expect(res.status).toBe(200)
  expect(profile().tier).not.toBe('pro')
})

test('incomplete subscription.created does not grant a paid tier', async () => {
  const res = await postEvent(subscriptionEvent('customer.subscription.created', 'incomplete', STRIPE_PRICE_IDS.P_EVO_MEMBER))
  expect(res.status).toBe(200)
  expect(profile().tier).not.toBe('member')
})

test('a later subscription.updated cannot revive a deleted subscription', async () => {
  getDb().tables.profiles[0].stripe_subscription_id = 'sub_1'
  getDb().tables.profiles[0].tier = 'pro'
  getDb().tables.profiles[0].role = 'escort'

  await postEvent({
    id: 'evt_deleted',
    type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_1', object: 'subscription', status: 'canceled', customer: 'cus_1' } },
  })
  expect(profile().tier).toBe('trial')

  const res = await postEvent(subscriptionEvent('customer.subscription.updated', 'canceled', STRIPE_PRICE_IDS.P_EVO_PRO))
  expect(res.status).toBe(200)
  expect(profile().tier).not.toBe('pro')
  expect(profile().stripe_subscription_id).toBeNull()
})

test('cancelling a carrier fleet subscription restores the carrier role', async () => {
  getDb().tables.profiles[0].role = 'carrier'
  getDb().tables.profiles[0].tier = 'carrier_member'

  await postEvent(subscriptionEvent('customer.subscription.updated', 'active', STRIPE_PRICE_IDS.FLEET_PRO))
  expect(profile().role).toBe('fleet_manager')

  const res = await postEvent({
    id: 'evt_deleted_fleet',
    type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_1', object: 'subscription', status: 'canceled', customer: 'cus_1' } },
  })
  expect(res.status).toBe(200)
  expect(profile().role).toBe('carrier')
  expect(profile().role).not.toBe('escort')
})

test('unpaid checkout.session.completed does not grant a paid tier or bgc_paid', async () => {
  const res = await postEvent({
    id: 'evt_unpaid',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_unpaid',
        object: 'checkout.session',
        payment_status: 'unpaid',
        status: 'complete',
        mode: 'subscription',
        customer: 'cus_1',
        subscription: 'sub_unpaid',
        client_reference_id: 'user-1',
        customer_details: { email: 'escort@example.com' },
        metadata: { userId: 'user-1', priceId: STRIPE_PRICE_IDS.P_EVO_PRO },
      },
    },
  })
  expect(res.status).toBe(200)
  expect(profile().tier).not.toBe('pro')

  const bgc = await postEvent({
    id: 'evt_bgc_unpaid',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_bgc',
        object: 'checkout.session',
        payment_status: 'unpaid',
        status: 'complete',
        mode: 'payment',
        metadata: { userId: 'user-1', priceId: STRIPE_PRICE_IDS.BGC_BADGE },
        client_reference_id: 'user-1',
      },
    },
  })
  expect(bgc.status).toBe(200)
  expect(profile().bgc_paid).not.toBe(true)
})

test('checkout tier follows the charged price, not a conflicting metadata price', async () => {
  const res = await postEvent({
    id: 'evt_mismatch',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_mismatch',
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        mode: 'subscription',
        customer: 'cus_1',
        subscription: 'sub_member',
        client_reference_id: 'user-1',
        metadata: { userId: 'user-1', priceId: STRIPE_PRICE_IDS.P_EVO_PRO },
        line_items: { data: [{ price: { id: STRIPE_PRICE_IDS.P_EVO_MEMBER } }] },
      },
    },
  })
  expect(res.status).toBe(200)
  expect(profile().tier).not.toBe('pro')
  expect(profile().tier).toBe('member')
})

test('a paid sponsored-zone purchase writes the real columns (zone, expires_at) and runs for 30 days', async () => {
  const res = await postEvent({
    id: 'evt_zone',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_zone',
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        mode: 'payment',
        metadata: { userId: 'user-1', priceId: STRIPE_PRICE_IDS.SPONSORED_ZONE, zone: 'in' },
        client_reference_id: 'user-1',
      },
    },
  })
  expect(res.status).toBe(200)
  const rows = getDb().tables.sponsored_zones ?? []
  expect(rows).toHaveLength(1)
  expect(rows[0]).toMatchObject({ user_id: 'user-1', zone: 'IN', active: true })
  expect(rows[0]).not.toHaveProperty('state')
  const days = (new Date(String(rows[0].expires_at)).getTime() - Date.now()) / 86400000
  expect(days).toBeGreaterThan(29.9)
  expect(days).toBeLessThan(30.1)
})
