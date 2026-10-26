import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
// These tests cover the old paid-review code, which is kept but switched off: run them with verification ON.
vi.mock('@/lib/verification', () => ({ VERIFICATION_LIVE: true, NOT_AVAILABLE: 'not available' }))

import { POST as uploadBgc } from '@/app/api/bgc/route'
import { POST as uploadCert } from '@/app/api/escort/cert-upload/route'
import { POST as uploadDd214 } from '@/app/api/dd214/route'
import { POST as uploadVerifyDoc } from '@/app/api/verify-doc/route'
import { POST as verifyUpload } from '@/app/api/verify-upload/route'
import { POST as postLoad } from '@/app/api/loads/route'

const SUPABASE = 'https://example.supabase.co'
const USER = 'user-1'
const OTHER = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function signIn() {
  getDb().sessionUser = { id: USER, email: 'user@example.com' }
  getDb().tables.profiles = [{
    id: USER,
    role: 'escort',
    tier: 'pro',
    suspended: false,
    bgc_paid: true,
    bgc_verified: false,
    pevo_paid: true,
    full_name: 'User',
    email: 'user@example.com',
  }]
}

beforeEach(() => {
  resetHostile()
  signIn()
})

test('bgc upload rejects a non document content type', async () => {
  const fd = new FormData()
  fd.set('file', new File(['<html></html>'], 'note.html', { type: 'text/html' }))
  const res = await uploadBgc(new NextRequest('http://localhost/api/bgc', { method: 'POST', body: fd }))
  expect(res.status).toBe(400)
  expect(getDb().tables.profiles[0].bgc_document_url).toBeUndefined()
})

test('bgc upload stores a signed url, not a public object url', async () => {
  const fd = new FormData()
  fd.set('file', new File(['%PDF-1.4'], 'check.pdf', { type: 'application/pdf' }))
  const res = await uploadBgc(new NextRequest('http://localhost/api/bgc', { method: 'POST', body: fd }))
  expect(res.status).toBe(200)
  const stored = String(getDb().tables.profiles[0].bgc_document_url ?? '')
  expect(stored).not.toContain('/object/public/')
  expect(getDb().storageOps.some((op) => op.op === 'createSignedUrl' && op.bucket === 'bgc-submissions')).toBe(true)
})

test('cert upload rejects a non pdf and a file over 10 MB', async () => {
  const html = new FormData()
  html.set('pdf', new File(['<html></html>'], 'cert.html', { type: 'text/html' }))
  html.set('expiryDate', '2030-01-01')
  html.set('certType', 'pevo')
  const htmlRes = await uploadCert(new NextRequest('http://localhost/api/escort/cert-upload', { method: 'POST', body: html }))
  expect(htmlRes.status).toBe(400)

  const big = new FormData()
  big.set('pdf', new File([new Uint8Array(11 * 1024 * 1024)], 'cert.pdf', { type: 'application/pdf' }))
  big.set('expiryDate', '2030-01-01')
  big.set('certType', 'pevo')
  const bigRes = await uploadCert(new NextRequest('http://localhost/api/escort/cert-upload', { method: 'POST', body: big }))
  expect(bigRes.status).toBe(400)
  expect(getDb().tables.certifications ?? []).toEqual([])
})

test('cert upload stores a signed url, not a public object url', async () => {
  const fd = new FormData()
  fd.set('pdf', new File(['%PDF-1.4'], 'cert.pdf', { type: 'application/pdf' }))
  fd.set('expiryDate', '2030-01-01')
  fd.set('certType', 'twic')
  const res = await uploadCert(new NextRequest('http://localhost/api/escort/cert-upload', { method: 'POST', body: fd }))
  expect(res.status).toBe(200)
  const stored = String((getDb().tables.certifications ?? [])[0]?.document_url ?? '')
  expect(stored).not.toContain('/object/public/')
  expect(getDb().storageOps.some((op) => op.op === 'createSignedUrl' && op.bucket === 'documents')).toBe(true)
})

test('dd214 upload stores a signed url, not a public object url', async () => {
  const fd = new FormData()
  fd.set('file', new File(['%PDF-1.4'], 'dd214.pdf', { type: 'application/pdf' }))
  const res = await uploadDd214(new NextRequest('http://localhost/api/dd214', { method: 'POST', body: fd }))
  expect(res.status).toBe(200)
  const stored = String(getDb().tables.profiles[0].dd214_url ?? '')
  expect(stored).not.toContain('/object/public/')
  expect(getDb().storageOps.some((op) => op.op === 'createSignedUrl' && op.bucket === 'verification-docs')).toBe(true)
})

test('verify-doc upload stores a signed url, not a public object url', async () => {
  const fd = new FormData()
  fd.set('file', new File(['%PDF-1.4'], 'vehicle.pdf', { type: 'application/pdf' }))
  fd.set('tier', 'tier2')
  const res = await uploadVerifyDoc(new NextRequest('http://localhost/api/verify-doc', { method: 'POST', body: fd }))
  expect(res.status).toBe(200)
  const patch = getDb().calls.find((c) => c.table === 'profiles' && c.op === 'update')?.payload as Record<string, unknown>
  expect(String(patch?.tier2_document_url ?? '')).not.toContain('/object/public/')
  expect(getDb().storageOps.some((op) => op.op === 'createSignedUrl' && op.bucket === 'verification-docs')).toBe(true)
})

test('verify-upload rejects another user storage url', async () => {
  const res = await verifyUpload(new NextRequest('http://localhost/api/verify-upload', {
    method: 'POST',
    body: JSON.stringify({
      tier: 1,
      fileName: 'mine.pdf',
      storagePath: `${USER}/mine.pdf`,
      documentUrl: `${SUPABASE}/storage/v1/object/public/pevo-certs/${OTHER}/secret.pdf`,
    }),
    headers: { 'content-type': 'application/json' },
  }))
  expect(res.status).toBe(400)
  const row = (getDb().tables.certifications ?? [])[0]
  expect(row).toBeUndefined()
})

test('posting a load rejects a permit url from another user', async () => {
  getDb().tables.profiles[0].role = 'carrier'
  const res = await postLoad(new NextRequest('http://localhost/api/loads', {
    method: 'POST',
    body: JSON.stringify({
      pickupCity: 'Honolulu',
      pickupState: 'HI',
      destinationCity: 'Hilo',
      destinationState: 'HI',
      escortType: 'steer',
      boardType: 'flat-rate',
      permitUrl: `${SUPABASE}/storage/v1/object/public/permits/${OTHER}/permit.pdf`,
    }),
    headers: { 'content-type': 'application/json' },
  }))
  expect(res.status).toBe(400)
  expect(getDb().tables.loads ?? []).toEqual([])
})

test('add-ons are never free: BGC and P/EVO uploads need the purchase first', async () => {
  getDb().tables.profiles[0].bgc_paid = false
  getDb().tables.profiles[0].pevo_paid = false
  const fd = new FormData()
  fd.set('file', new File(['%PDF-1.4'], 'bgc.pdf', { type: 'application/pdf' }))
  const bgc = await uploadBgc(new NextRequest('http://localhost/api/bgc', { method: 'POST', body: fd }))
  expect(bgc.status).toBe(402)
  const cert = new FormData()
  cert.set('pdf', new File(['%PDF-1.4'], 'c.pdf', { type: 'application/pdf' }))
  cert.set('certType', 'pevo')
  cert.set('expiryDate', '2030-01-01')
  const res = await uploadCert(new NextRequest('http://localhost/api/escort/cert-upload', { method: 'POST', body: cert }))
  expect(res.status).toBe(402)
  const vu = await verifyUpload(new NextRequest('http://localhost/api/verify-upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tier: 1, fileName: 'mine.pdf', storagePath: `${USER}/mine.pdf`, documentUrl: `${SUPABASE}/storage/v1/object/public/pevo-certs/${USER}/mine.pdf` }),
  }))
  expect(vu.status).toBe(402)
})
