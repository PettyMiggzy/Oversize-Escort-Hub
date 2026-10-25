import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { GET as party } from '@/app/api/contact/party/route'
import { GET as directory } from '@/app/api/contact/directory/route'
import { POST as lookup } from '@/app/api/contact/lookup/route'
import { GET as me } from '@/app/api/profile/me/route'

function partyReq(userId: string, loadId?: string) {
  const q = new URLSearchParams({ userId })
  if (loadId) q.set('loadId', loadId)
  return new NextRequest(`http://localhost/api/contact/party?${q}`)
}

beforeEach(() => {
  resetHostile()
  getDb().tables.profiles = [
    { id: 'carrier', role: 'carrier', full_name: 'Carrier Co', phone: '8085550101', email: 'carrier@example.com', stripe_customer_id: 'cus_carrier' },
    { id: 'escort', role: 'escort', full_name: 'Matched Escort', phone: '8085550102', email: 'escort@example.com', dot_number: '999' },
    { id: 'bidder', role: 'escort', full_name: 'Pending Bidder', phone: '8085550103', email: 'bidder@example.com' },
    { id: 'stranger', role: 'escort', full_name: 'Stranger', phone: '8085550104', email: 'stranger@example.com' },
    { id: 'admin', role: 'admin', full_name: 'Admin', phone: '8085550105', email: 'admin@example.com' },
    { id: 'fleet', role: 'fleet_manager', full_name: 'Fleet Boss', phone: '8085550106', email: 'fleet@example.com' },
  ]
  getDb().tables.loads = [
    { id: 'load-filled', status: 'filled', carrier_id: 'carrier', matched_escort_id: 'escort' },
    { id: 'load-pending', status: 'pending_match', carrier_id: 'carrier', matched_escort_id: 'escort' },
    { id: 'load-open', status: 'open', carrier_id: 'carrier', matched_escort_id: null },
    { id: 'load-expired', status: 'expired', carrier_id: 'carrier', matched_escort_id: 'escort' },
  ]
  getDb().tables.bids = [
    { id: 'bid-open', load_id: 'load-open', escort_id: 'bidder', status: 'pending', rate: 4 },
    { id: 'bid-lost', load_id: 'load-pending', escort_id: 'bidder', status: 'pending', rate: 3 },
  ]
})

test('contact route refuses a signed-out caller', async () => {
  getDb().sessionUser = null
  const res = await party(partyReq('escort', 'load-filled'))
  expect(res.status).toBe(401)
})

test('contact route refuses a stranger', async () => {
  getDb().sessionUser = { id: 'stranger', email: 'stranger@example.com' }
  const res = await party(partyReq('escort', 'load-filled'))
  expect(res.status).toBe(403)
  const body = await res.json()
  expect(JSON.stringify(body)).not.toContain('8085550102')
  expect(JSON.stringify(body)).not.toContain('escort@example.com')
})

test('contact route refuses a pending bidder', async () => {
  getDb().sessionUser = { id: 'bidder', email: 'bidder@example.com' }
  const open = await party(partyReq('carrier', 'load-open'))
  expect(open.status).toBe(403)
  const lost = await party(partyReq('carrier', 'load-pending'))
  expect(lost.status).toBe(403)
  const body = await lost.json()
  expect(JSON.stringify(body)).not.toContain('8085550101')
})

test('contact route allows the matched escort and the load carrier', async () => {
  getDb().sessionUser = { id: 'escort', email: 'escort@example.com' }
  const asEscort = await party(partyReq('carrier', 'load-filled'))
  expect(asEscort.status).toBe(200)
  expect(await asEscort.json()).toEqual({
    full_name: 'Carrier Co',
    phone: '8085550101',
    email: 'carrier@example.com',
  })

  const pending = await party(partyReq('carrier', 'load-pending'))
  expect(pending.status).toBe(200)
  expect(await pending.json()).toMatchObject({ phone: '8085550101', email: 'carrier@example.com' })

  getDb().sessionUser = { id: 'carrier', email: 'carrier@example.com' }
  const asCarrier = await party(partyReq('escort', 'load-filled'))
  expect(asCarrier.status).toBe(200)
  expect(await asCarrier.json()).toMatchObject({ phone: '8085550102', email: 'escort@example.com' })

  const asCarrierPending = await party(partyReq('escort', 'load-pending'))
  expect(asCarrierPending.status).toBe(200)
  expect(await asCarrierPending.json()).toMatchObject({ phone: '8085550102' })
})

test('a party cannot read someone who is not the other party, or a closed load', async () => {
  getDb().sessionUser = { id: 'carrier', email: 'carrier@example.com' }
  const third = await party(partyReq('stranger', 'load-filled'))
  expect(third.status).toBe(403)
  const expired = await party(partyReq('escort', 'load-expired'))
  expect(expired.status).toBe(403)
})

test('contact route allows an admin', async () => {
  getDb().sessionUser = { id: 'admin', email: 'admin@example.com' }
  const res = await party(partyReq('escort'))
  expect(res.status).toBe(200)
  expect(await res.json()).toMatchObject({ phone: '8085550102', email: 'escort@example.com' })
  const onLoad = await party(partyReq('carrier', 'load-open'))
  expect(onLoad.status).toBe(200)
  expect(await onLoad.json()).toMatchObject({ email: 'carrier@example.com' })
})

test('admin directory is closed to a normal user and open to an admin', async () => {
  getDb().sessionUser = { id: 'stranger', email: 'stranger@example.com' }
  expect((await directory()).status).toBe(403)
  getDb().sessionUser = { id: 'admin', email: 'admin@example.com' }
  const res = await directory()
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.users.map((u: { id: string }) => u.id)).toContain('escort')
  expect(body.users.find((u: { id: string }) => u.id === 'escort').email).toBe('escort@example.com')
})

test('fleet lookup does not hand the browser a phone or email', async () => {
  getDb().sessionUser = { id: 'stranger', email: 'stranger@example.com' }
  const denied = await lookup(new NextRequest('http://localhost/api/contact/lookup', {
    method: 'POST',
    body: JSON.stringify({ email: 'escort@example.com' }),
    headers: { 'content-type': 'application/json' },
  }))
  expect(denied.status).toBe(403)

  getDb().sessionUser = { id: 'fleet', email: 'fleet@example.com' }
  const res = await lookup(new NextRequest('http://localhost/api/contact/lookup', {
    method: 'POST',
    body: JSON.stringify({ email: 'escort@example.com' }),
    headers: { 'content-type': 'application/json' },
  }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.profile).toEqual({ id: 'escort', full_name: 'Matched Escort', role: 'escort' })
  expect(body.profile.phone).toBeUndefined()
  expect(body.profile.email).toBeUndefined()
})

test('own profile route returns the caller row and not someone else', async () => {
  getDb().sessionUser = null
  expect((await me()).status).toBe(401)
  getDb().sessionUser = { id: 'escort', email: 'escort@example.com' }
  const res = await me()
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.profile.id).toBe('escort')
  expect(body.profile.phone).toBe('8085550102')
  expect(body.profile.email).toBe('escort@example.com')
})

test('fleet lookup only confirms escorts, so it cannot probe carrier or broker emails', async () => {
  const ask = (email: string) => lookup(new NextRequest('http://localhost/api/contact/lookup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  }))
  getDb().sessionUser = { id: 'fleet', email: 'fleet@example.com' }
  expect((await ask('carrier@example.com')).status).toBe(404)
  expect((await ask('escort@example.com')).status).toBe(200)
  getDb().sessionUser = { id: 'admin', email: 'admin@example.com' }
  expect((await ask('carrier@example.com')).status).toBe(200)
})
