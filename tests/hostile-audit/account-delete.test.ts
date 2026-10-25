import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { POST as deleteAccount } from '@/app/api/account/delete/route'
import { POST as recordTrial } from '@/app/api/check-trial/route'

function deleteReq() {
  return new NextRequest('http://localhost/api/account/delete', {
    method: 'POST',
    body: JSON.stringify({ confirm: 'DELETE' }),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: 'user-1', email: 'user@example.com' }
  getDb().tables.profiles = [{
    id: 'user-1',
    role: 'escort',
    tier: 'pro',
    email: 'user@example.com',
    phone: '8085550100',
    full_name: 'Real Name',
    company_name: 'Haul Co',
    bio: 'Lives in Hilo, plate ABC123',
    vehicle: '2019 Ford F150 white',
    states_licensed: ['HI'],
    notification_states: ['HI'],
    dot_number: '1234567',
    mc_number: '7654321',
    fmcsa_verified: true,
    stripe_customer_id: 'cus_live',
    stripe_subscription_id: 'sub_live',
    bgc_document_url: 'https://example.supabase.co/storage/v1/object/public/bgc-submissions/bgc/user-1/check.pdf',
    dd214_url: 'https://example.supabase.co/storage/v1/object/public/verification-docs/dd214/user-1/dd214.pdf',
  }]
})

test('trial fingerprints recorded for the account are removed on delete', async () => {
  const recorded = await recordTrial(new NextRequest('http://localhost/api/check-trial', {
    method: 'POST',
    body: JSON.stringify({ fp: 'device-fingerprint-1' }),
    headers: { 'content-type': 'application/json' },
  }))
  expect(recorded.status).toBe(200)

  const res = await deleteAccount(deleteReq())
  expect(res.status).toBe(200)
  expect(getDb().tables.device_fingerprints ?? []).toEqual([])
})

test('deletion removes stored identity documents and the Stripe customer', async () => {
  const res = await deleteAccount(deleteReq())
  expect(res.status).toBe(200)

  const buckets = getDb().storageOps
    .filter((op) => op.op === 'remove' || op.op === 'list')
    .map((op) => op.bucket)
  expect(buckets).toEqual(expect.arrayContaining([
    'bgc-submissions',
    'verification-docs',
    'documents',
    'pevo-certs',
    'vehicle-docs',
    'permits',
  ]))
  expect(getDb().stripeCalls).toEqual(expect.arrayContaining([
    expect.objectContaining({ op: 'cancel', id: 'sub_live' }),
    expect.objectContaining({ op: 'del', id: 'cus_live' }),
  ]))
})

test('deletion clears leftover profile PII and the Stripe customer id', async () => {
  const res = await deleteAccount(deleteReq())
  expect(res.status).toBe(200)
  const merged = Object.assign(
    {},
    ...getDb().calls.filter((c) => c.table === 'profiles' && c.op === 'update').map((c) => c.payload as Record<string, unknown>),
  )
  expect(merged).toMatchObject({
    email: null,
    phone: null,
    bio: null,
    vehicle: null,
    states_licensed: null,
    notification_states: null,
    dot_number: null,
    mc_number: null,
    stripe_customer_id: null,
    bgc_document_url: null,
    dd214_url: null,
  })
})

test('a failed load close aborts deletion so open loads are not left claimable', async () => {
  getDb().tables.loads = [{
    id: 'load-open',
    carrier_id: 'user-1',
    status: 'open',
    board_type: 'flat-rate',
    pu_state: 'HI',
    dl_state: 'HI',
  }]
  getDb().fail = { table: 'loads', op: 'update' }

  const res = await deleteAccount(deleteReq())
  expect(res.ok).toBe(false)
  expect(getDb().authOps.filter((op) => op.op === 'deleteUser')).toEqual([])
  expect(getDb().tables.loads[0].status).toBe('open')
})
