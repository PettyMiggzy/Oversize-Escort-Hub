import { beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'

// The same routes with plans no longer free: documents belong to a paid plan.
vi.mock('@/lib/free-launch', async (orig) => ({ ...(await orig<typeof import('@/lib/free-launch')>()), FREE_LAUNCH: false }))
import { GET as list, POST as toggle } from '@/app/api/escort/docs/route'
import { GET as openDoc } from '@/app/api/escort-doc/[certId]/route'
import { POST as upload } from '@/app/api/escort/cert-upload/route'
import { canUseDocs } from '@/lib/profile-docs'

const C1 = '11111111-1111-4111-8111-111111111111'
const j = (body: unknown) => new NextRequest('http://localhost/api/escort/docs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const send = () => {
  const fd = new FormData(); fd.set('pdf', new File(['%PDF-1.4'], 'p.pdf', { type: 'application/pdf' })); fd.set('expiryDate', '2030-01-01'); fd.set('certType', 'insurance')
  return upload(new NextRequest('http://localhost/api/escort/cert-upload', { method: 'POST', body: fd }))
}
const setTier = (tier: string | null, role = 'escort') => { getDb().tables.profiles = [{ id: 'esc', role, tier }] }

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: 'esc', email: 'e@x.example' }
  getDb().tables.certifications = [{ id: C1, user_id: 'esc', type: 'insurance', status: 'approved', expiry_date: '2099-01-01', show_on_profile: true, document_url: 'https://example.supabase.co/storage/v1/object/sign/documents/certs/a.pdf?token=t' }]
})

test('who counts as paid', () => {
  expect(canUseDocs('pro', 'escort', false)).toBe(true)
  expect(canUseDocs('member', 'escort', false)).toBe(true)
  expect(canUseDocs('fleet_plus', 'fleet_manager', false)).toBe(true)
  expect(canUseDocs('free', 'escort', false)).toBe(false)
  expect(canUseDocs(null, 'escort', false)).toBe(false)
  expect(canUseDocs(null, 'admin', false)).toBe(true)
  expect(canUseDocs(null, 'escort', true)).toBe(true) // while plans are free
})

test('without a paid plan: no upload, no switching on, the list says so, and nothing shows to visitors', async () => {
  setTier('free')
  const up = await send()
  expect(up.status).toBe(402)
  expect((await up.json()).upgrade).toBe(true)
  expect(getDb().tables.certifications).toHaveLength(1)
  expect((await (await list()).json()).canUpload).toBe(false)
  const on = await toggle(j({ certId: C1, show: true }))
  expect(on.status).toBe(402)
  // turning one OFF is always allowed
  expect((await toggle(j({ certId: C1, show: false }))).status).toBe(200)
  getDb().tables.certifications[0].show_on_profile = true
  getDb().sessionUser = null
  expect((await openDoc(new NextRequest('http://localhost/api/escort-doc/' + C1), { params: Promise.resolve({ certId: C1 }) })).status).toBe(404)
})

test('with a paid plan everything works, and a lapsed plan hides the document again', async () => {
  setTier('pro')
  expect((await send()).status).toBe(200)
  expect((await (await list()).json()).canUpload).toBe(true)
  getDb().sessionUser = null
  const open = () => openDoc(new NextRequest('http://localhost/api/escort-doc/' + C1), { params: Promise.resolve({ certId: C1 }) })
  expect((await open()).status).toBe(302)
  setTier('free')
  expect((await open()).status).toBe(404)
})
