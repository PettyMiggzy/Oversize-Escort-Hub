import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { VERIFICATION_LIVE, NOT_AVAILABLE } from '@/lib/verification'
import { POST as bgc } from '@/app/api/bgc/route'
import { POST as bgcSession } from '@/app/api/bgc/verify-session/route'
import { POST as bgcCheckout } from '@/app/api/bgc-checkout/route'
import { POST as verifyUpload } from '@/app/api/verify-upload/route'
import { POST as verifyDoc } from '@/app/api/verify-doc/route'
import { POST as checkout } from '@/app/api/checkout/route'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'

// We do not check or verify people or documents. The old code stays behind a switch that is off.
const root = path.resolve(__dirname, '../..')
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8')

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: 'u1', email: 'u1@example.com' }
  getDb().tables.profiles = [{ id: 'u1', role: 'escort', tier: 'pro', email: 'u1@example.com' }]
})

test('the switch is off by default', () => {
  expect(VERIFICATION_LIVE).toBe(false)
  expect(NOT_AVAILABLE).toMatch(/does not check or verify/)
})

test('every verification route answers 410 and stores nothing', async () => {
  const post = (url: string) => new NextRequest(`http://localhost${url}`, { method: 'POST', body: new FormData() })
  expect((await bgc(post('/api/bgc'))).status).toBe(410)
  expect((await bgcCheckout(post('/api/bgc-checkout'))).status).toBe(410)
  expect((await verifyUpload(post('/api/verify-upload'))).status).toBe(410)
  expect((await verifyDoc(post('/api/verify-doc'))).status).toBe(410)
  expect((await bgcSession(post('/api/bgc/verify-session'))).status).toBe(410)
  expect(getDb().tables.certifications ?? []).toEqual([])
})

test('checkout refuses the review add-ons', async () => {
  for (const id of [STRIPE_PRICE_IDS.BGC_BADGE, STRIPE_PRICE_IDS.PEVO_MEMBER_REVIEW, STRIPE_PRICE_IDS.PEVO_PRO_REVIEW]) {
    const res = await checkout(new NextRequest('http://localhost/api/checkout', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ priceId: id }),
    }))
    expect(res.status, String(id)).not.toBe(200)
    expect(res.status, String(id)).toBeLessThan(500)
  }
})

test('the old verification pages send everyone to the "not live" page', () => {
  for (const f of ['bgc', 'bgc-badge', 'bgc-checkout', 'verify', 'verification']) {
    expect(read(`app/${f}/page.tsx`), f).toContain("redirect('/coming-later')")
  }
  expect(read('app/coming-later/page.tsx')).toMatch(/Not live yet/)
  expect(read('app/sitemap.ts')).toContain('/coming-later')
})

test('Terms and the pricing page say no verification and sell no review', () => {
  expect(read('app/terms/page.tsx')).toMatch(/not (check|verify)|No verification/i)
  const pricing = read('app/pricing/page.tsx')
  expect(pricing).not.toMatch(/BGC_BADGE|bgc_badge|PEVO_MEMBER_REVIEW|PEVO_PRO_REVIEW|Background check/i)
})

test('badges only render behind the switch', () => {
  for (const f of ['app/find-escorts/page.tsx', 'app/open-loads/_client.tsx', 'app/bid-board/_client.tsx', 'app/flat-rate/_client.tsx', 'app/escorts/[id]/page.tsx', 'app/fleet-dashboard/_client.tsx', 'app/dashboard/_client.tsx']) {
    expect(read(f), f).toContain('VERIFICATION_LIVE')
  }
})

test('the helper is told there is no verification', () => {
  expect(read('lib/helper-knowledge.ts')).toMatch(/NO VERIFICATION/)
})

test('Terms and Privacy name the operator and no longer describe a background-check badge or its fee', () => {
  for (const f of ['app/terms/page.tsx', 'app/privacy/page.tsx']) {
    const src = read(f)
    expect(src, f).toContain('Precision Pilot Services, LLC')
    expect(src, f).not.toMatch(/\$9\.99|BGC Badge|badge issuance/i)
  }
})

test('the DD-214 upload and review routes are switched off', async () => {
  const { POST: dd214 } = await import('@/app/api/dd214/route')
  const { POST: submit, PUT: decide } = await import('@/app/api/veteran/dd214-submit/route')
  const { POST: adminDd214 } = await import('@/app/api/admin/dd214/route')
  const req = (m: string) => new NextRequest('http://localhost/x', { method: m, body: new FormData() })
  expect((await dd214(req('POST'))).status).toBe(410)
  expect((await submit(req('POST'))).status).toBe(410)
  expect((await decide(req('PUT'))).status).toBe(410)
  expect((await adminDd214(req('POST'))).status).toBe(410)
  expect(getDb().tables.dd214_submissions ?? []).toEqual([])
})
