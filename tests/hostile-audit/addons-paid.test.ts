import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
// These tests cover the old paid-review code, which is kept but switched off: run them with verification ON.
vi.mock('@/lib/verification', () => ({ VERIFICATION_LIVE: true, NOT_AVAILABLE: 'not available' }))

import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'
import { POST as checkout } from '@/app/api/checkout/route'
import { POST as bgcCheckout } from '@/app/api/bgc-checkout/route'

const buy = (priceId: string, zone?: string) => checkout(new NextRequest('http://localhost/api/checkout', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ priceId, ...(zone ? { zone } : {}) }),
}))

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: 'u1', email: 'u1@example.com' }
  getDb().tables.profiles = [{ id: 'u1', role: 'escort', tier: 'free', email: 'u1@example.com' }]
})

test('during the free launch plans are refused but add-ons are for sale', async () => {
  for (const plan of [STRIPE_PRICE_IDS.P_EVO_PRO, STRIPE_PRICE_IDS.P_EVO_MEMBER]) {
    const res = await buy(plan)
    expect(res.status, String(plan)).toBe(403)
    expect(String((await res.json()).error)).toMatch(/Plans are free/)
  }
  for (const addon of [STRIPE_PRICE_IDS.BGC_BADGE, STRIPE_PRICE_IDS.PEVO_MEMBER_REVIEW, STRIPE_PRICE_IDS.PEVO_PRO_REVIEW]) {
    const res = await buy(addon)
    // the mock has no Stripe: the point is it is NOT refused as "free"
    expect(res.status, String(addon)).not.toBe(403)
  }
})

test('the BGC checkout route no longer says everything is free', async () => {
  // the mock has no Stripe, so the call may throw after it passes the old "free" refusal: either way it is not a 403
  let status = 0
  try { status = (await bgcCheckout(new NextRequest('http://localhost/api/bgc-checkout', { method: 'POST' }))).status } catch { status = 500 }
  expect(status).not.toBe(403)
})

test('the sponsored-zone price id is the same in checkout, pricing and the webhook, and it is a one-time price', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const read = (f: string) => fs.readFileSync(path.resolve(__dirname, '../..', f), 'utf8')
  const id = STRIPE_PRICE_IDS.SPONSORED_ZONE
  expect(read('app/api/webhook/route.ts')).toContain(`SPONSORED_PRICE = '${id}'`)
  expect(read('app/pricing/page.tsx')).toContain(`sponsored_zone: "${id}"`)
  // the old id was a monthly subscription price: Stripe refuses it in payment mode, so nobody could ever buy
  expect(id).not.toBe('price_1TLSu3LmfugPCRbAsumfZjCf')
})
