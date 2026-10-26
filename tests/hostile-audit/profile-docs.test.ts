import fs from 'node:fs'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { GET as list, POST as toggle } from '@/app/api/escort/docs/route'
import { GET as openDoc } from '@/app/api/escort-doc/[certId]/route'
import { POST as upload } from '@/app/api/escort/cert-upload/route'
import { isPublic, parseStorageUrl, sniffDocType, docLabel } from '@/lib/profile-docs'

const C1 = '11111111-1111-4111-8111-111111111111'
const C2 = '22222222-2222-4222-8222-222222222222'
const C3 = '33333333-3333-4333-8333-333333333333'
const today = new Date().toISOString().slice(0, 10)
const future = '2099-01-01', past = '2001-01-01'
const url = (b: string, p: string) => `https://example.supabase.co/storage/v1/object/sign/${b}/${p}?token=abc`
const j = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const ctx = (certId: string) => ({ params: Promise.resolve({ certId }) })

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: 'esc', email: 'e@x.example' }
  getDb().tables.profiles = [{ id: 'esc', role: 'escort', pevo_paid: true }, { id: 'other', role: 'escort' }]
  getDb().tables.certifications = [
    { id: C1, user_id: 'esc', type: 'insurance', status: 'approved', expiry_date: future, show_on_profile: true, document_url: url('documents', 'certs/cert_esc_1.pdf'), created_at: new Date().toISOString() },
    { id: C2, user_id: 'esc', type: 'pevo', status: 'pending', expiry_date: future, show_on_profile: true, document_url: url('documents', 'certs/cert_esc_2.pdf'), created_at: new Date().toISOString() },
    { id: C3, user_id: 'other', type: 'insurance', status: 'approved', expiry_date: future, show_on_profile: false, document_url: url('documents', 'certs/cert_other.pdf'), created_at: new Date().toISOString() },
  ]
})

test('what counts as public: approved, switched on, not expired', () => {
  const base = { id: 'x', user_id: 'u', type: 'insurance', status: 'approved', expiry_date: future, show_on_profile: true }
  expect(isPublic(base)).toBe(true)
  expect(isPublic({ ...base, status: 'pending' })).toBe(false)
  expect(isPublic({ ...base, status: 'rejected' })).toBe(false)
  expect(isPublic({ ...base, show_on_profile: false })).toBe(false)
  expect(isPublic({ ...base, show_on_profile: null })).toBe(false)
  expect(isPublic({ ...base, expiry_date: past })).toBe(false)
  expect(isPublic({ ...base, expiry_date: today })).toBe(true)
  expect(isPublic({ ...base, expiry_date: null })).toBe(true)
})

test('a visitor gets a short link only for a public document; everything else is a 404 with no hint', async () => {
  getDb().sessionUser = null // an anonymous visitor
  const ok = await openDoc(new NextRequest('http://localhost/api/escort-doc/' + C1), ctx(C1))
  expect(ok.status).toBe(302)
  expect(ok.headers.get('location')).toMatch(/^https:\/\//)
  expect(ok.headers.get('cache-control')).toBe('no-store')
  const signed = getDb().storageOps.filter((o) => o.op === 'createSignedUrl')
  expect(signed[0]).toMatchObject({ bucket: 'documents', path: 'certs/cert_esc_1.pdf' })
  for (const id of [C2 /* pending */, C3 /* switched off */, 'not-a-uuid', '99999999-9999-4999-8999-999999999999']) {
    expect((await openDoc(new NextRequest('http://localhost/api/escort-doc/' + id), ctx(id))).status, id).toBe(404)
  }
  getDb().tables.certifications[0].expiry_date = past
  expect((await openDoc(new NextRequest('http://localhost/api/escort-doc/' + C1), ctx(C1))).status).toBe(404)
  // a stored address that is not one of our buckets is never signed
  getDb().tables.certifications[0].expiry_date = future
  getDb().tables.certifications[0].document_url = 'https://evil.example/storage/v1/object/sign/secrets/key.pdf'
  expect((await openDoc(new NextRequest('http://localhost/api/escort-doc/' + C1), ctx(C1))).status).toBe(404)
})

test('storage address parsing only accepts our own document buckets', () => {
  expect(parseStorageUrl(url('documents', 'certs/a%20b.pdf'))).toEqual({ bucket: 'documents', path: 'certs/a b.pdf' })
  expect(parseStorageUrl(url('pevo-certs', 'u1/x.pdf'))?.bucket).toBe('pevo-certs')
  expect(parseStorageUrl(url('bgc-submissions', 'u1/x.pdf'))).toBe(null)
  expect(parseStorageUrl(url('documents', '../etc/passwd'))).toBe(null)
  expect(parseStorageUrl('nope')).toBe(null)
  expect(parseStorageUrl(null)).toBe(null)
})

test('the owner lists and switches only their own documents; no file links in the list', async () => {
  const l = await (await list()).json()
  expect(l.documents.map((d: { id: string }) => d.id).sort()).toEqual([C1, C2].sort())
  // the mock returns whole rows, so prove the route asks only for these columns
  const listSrc = fs.readFileSync('app/api/escort/docs/route.ts', 'utf8')
  expect(listSrc).toContain("select('id, type, status, expiry_date, show_on_profile, reject_reason, created_at')")
  expect(listSrc).not.toMatch(/select\([^)]*document_url/)
  expect((await toggle(j('/api/escort/docs', { certId: C1, show: false }))).status).toBe(200)
  expect(getDb().tables.certifications[0].show_on_profile).toBe(false)
  expect((await toggle(j('/api/escort/docs', { certId: C3, show: true }))).status).toBe(404) // someone else's
  expect(getDb().tables.certifications[2].show_on_profile).toBe(false)
  expect((await toggle(j('/api/escort/docs', { certId: C1, show: 'yes' }))).status).toBe(400)
  expect((await toggle(j('/api/escort/docs', { certId: 'x', show: true }))).status).toBe(400)
  const live = await (await toggle(j('/api/escort/docs', { certId: C2, show: true }))).json()
  expect(live.live).toBe(false) // pending: it will show once reviewed
  getDb().sessionUser = null
  expect((await list()).status).toBe(401)
  expect((await toggle(j('/api/escort/docs', { certId: C1, show: true }))).status).toBe(401)
})

test('uploads: a PDF or a real photo, judged by the file itself; insurance needs no purchase; spam is capped', async () => {
  getDb().tables.certifications = []
  const send = (bytes: Uint8Array | string, name: string, type: string, certType = 'insurance') => {
    const fd = new FormData(); fd.set('pdf', new File([bytes as BlobPart], name, { type })); fd.set('expiryDate', '2030-01-01'); fd.set('certType', certType)
    return upload(new NextRequest('http://localhost/api/escort/cert-upload', { method: 'POST', body: fd }))
  }
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  expect((await send(jpeg, 'policy.jpg', 'image/jpeg')).status).toBe(200)
  expect((await send(png, 'policy.png', 'image/png')).status).toBe(200)
  expect((await send('%PDF-1.4', 'policy.pdf', 'application/pdf')).status).toBe(200)
  // the browser's word is not enough: an HTML file dressed as an image is refused
  expect((await send('<html>hi</html>', 'x.jpg', 'image/jpeg')).status).toBe(400)
  expect((await send('MZ-binary', 'x.pdf', 'application/pdf')).status).toBe(400)
  // a P/EVO certificate still needs the review purchase
  getDb().tables.profiles[0].pevo_paid = false
  expect((await send('%PDF-1.4', 'c.pdf', 'application/pdf', 'pevo')).status).toBe(402)
  // only five waiting at once
  expect((await send('%PDF-1.4', 'a.pdf', 'application/pdf')).status).toBe(200)
  expect((await send('%PDF-1.4', 'b.pdf', 'application/pdf')).status).toBe(200)
  expect((await send('%PDF-1.4', 'c.pdf', 'application/pdf')).status).toBe(429)
  expect(sniffDocType(new Uint8Array([1, 2, 3]))).toBe(null)
  expect(docLabel('insurance')).toBe('Proof of insurance')
})

test('the public profile page never selects or prints the stored file address, and only approved documents are listed', () => {
  const src = fs.readFileSync('app/escorts/[id]/page.tsx', 'utf8')
  expect(src).not.toMatch(/from\('certifications'\)\.select\('\*'\)/)
  expect(src).not.toMatch(/document_url/)
  expect(src).toContain("c.status === 'approved'")
  expect(src).toContain('/api/escort-doc/')
  expect(fs.readFileSync('middleware.ts', 'utf8')).toContain("'/my-documents'")
  expect(fs.readFileSync('app/escort-cert/page.tsx', 'utf8')).toContain("redirect('/my-documents')")
})
