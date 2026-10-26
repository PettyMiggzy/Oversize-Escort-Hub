import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { POST as start } from '@/app/api/quick-post/route'
import { POST as confirm } from '@/app/api/quick-post/confirm/route'
import { GET as adminList, POST as adminAct } from '@/app/api/admin/quick-posts/route'
import { POST as report } from '@/app/api/loads/report/route'
import { hashToken } from '@/lib/quick-post'

const L1 = '11111111-1111-4111-8111-111111111111'
const L2 = '22222222-2222-4222-8222-222222222222'
const j = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '8.8.8.8' }, body: JSON.stringify(body) })
const good = { email: 'dispatch@carrier.example', name: 'Dana', company: '', phone: '', pickupCity: 'Dallas', pickupState: 'TX', destinationCity: 'Tulsa', destinationState: 'OK', escortType: 'Lead', escortCount: 1, boardType: 'flat-rate', rate: 2.5, dateNeeded: '', notes: '', website: '', startedAt: Date.now() - 10000 }

beforeEach(() => { resetHostile() })

test('temporary email addresses and links, emails or phone numbers in the notes are refused', async () => {
  expect((await start(j('/api/quick-post', { ...good, email: 'x@mailinator.com' }))).status).toBe(400)
  expect((await start(j('/api/quick-post', { ...good, email: 'x@YOPMAIL.com' }))).status).toBe(400)
  for (const notes of ['call me 555 123 4567', 'text +1 (555) 123-4567', 'see https://spam.example', 'visit www.spam.example now', 'mail me at a@b.example', 'buy at cheap.xyz']) {
    expect((await start(j('/api/quick-post', { ...good, notes }))).status, notes).toBe(400)
  }
  // ordinary load notes still pass
  expect((await start(j('/api/quick-post', { ...good, notes: "14'6\" tall, 12' wide, 80,000 lbs. Pickup 6am." }))).status).toBe(200)
})

test('a confirmed account-free load is tagged so admins can find it', async () => {
  const T = 'c'.repeat(64)
  getDb().tables.quick_post_drafts = [{ id: 'd1', token_hash: hashToken(T), email: 'dispatch@carrier.example', created_at: new Date().toISOString(), used_at: null,
    payload: { name: 'Dana', company: '', phone: '', pickupCity: 'Dallas', pickupState: 'TX', destinationCity: 'Tulsa', destinationState: 'OK', escortType: 'Lead', escortCount: 1, boardType: 'flat-rate', rate: 2.5, dateNeeded: null, notes: '' } }]
  expect((await confirm(j('/api/quick-post/confirm', { t: T }))).status).toBe(200)
  expect(getDb().tables.loads[0].source).toBe('quick_post')
})

function adminSession() {
  getDb().sessionUser = { id: 'admin', email: 'admin@example.com' }
  getDb().tables.profiles = [{ id: 'admin', role: 'admin', email: 'admin@example.com' }, { id: 'c1', role: 'carrier', email: 'dispatch@carrier.example', full_name: 'Dana', created_at: new Date().toISOString() }]
}

test('only admins can list or act on quick posts', async () => {
  getDb().sessionUser = { id: 'u', email: 'u@example.com' }
  getDb().tables.profiles = [{ id: 'u', role: 'escort', email: 'u@example.com' }]
  expect((await adminList()).status).toBe(403)
  expect((await adminAct(j('/api/admin/quick-posts', { loadId: L1, action: 'remove' }))).status).toBe(403)
  getDb().sessionUser = null
  expect((await adminList()).status).toBe(401)
})

test('admins see unchecked account-free loads, and ok / remove / ban work', async () => {
  adminSession()
  const now = new Date().toISOString()
  getDb().tables.loads = [
    { id: L1, carrier_id: 'c1', source: 'quick_post', status: 'open', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', created_at: now },
    { id: L2, carrier_id: 'c1', source: 'quick_post', status: 'open', pu_city: 'A', pu_state: 'TX', dl_city: 'B', dl_state: 'OK', created_at: now },
    { id: '33333333-3333-4333-8333-333333333333', carrier_id: 'c1', source: null, status: 'open', pu_city: 'Normal', pu_state: 'TX', dl_city: 'Post', dl_state: 'OK', created_at: now },
  ]
  const list = await (await adminList()).json()
  expect(list.quickPosts.map((l: { id: string }) => l.id).sort()).toEqual([L1, L2].sort())
  expect(list.quickPosts[0].poster.email).toBe('dispatch@carrier.example')

  expect((await adminAct(j('/api/admin/quick-posts', { loadId: L1, action: 'ok' }))).status).toBe(200)
  expect(getDb().tables.loads[0].reviewed_at).toBeTruthy()
  expect(getDb().tables.loads[0].status).toBe('open')
  expect((await (await adminList()).json()).quickPosts).toHaveLength(1)

  expect((await adminAct(j('/api/admin/quick-posts', { loadId: L2, action: 'remove' }))).status).toBe(200)
  expect(getDb().tables.loads[1].status).toBe('cancelled')
  expect(getDb().tables.profiles.find((p) => p.id === 'c1')?.suspended).toBeUndefined()

  expect((await adminAct(j('/api/admin/quick-posts', { loadId: L1, action: 'ban' }))).status).toBe(200)
  expect(getDb().tables.profiles.find((p) => p.id === 'c1')?.suspended).toBe(true)
  expect(getDb().tables.loads.filter((l) => l.carrier_id === 'c1').every((l) => l.status === 'cancelled')).toBe(true)

  expect((await adminAct(j('/api/admin/quick-posts', { loadId: 'not-a-uuid', action: 'ban' }))).status).toBe(400)
  expect((await adminAct(j('/api/admin/quick-posts', { loadId: L1, action: 'nuke' }))).status).toBe(400)
})

test('reports: sign-in needed, not your own load, one per person, three people hide the load', async () => {
  const load = { id: L1, carrier_id: 'c1', status: 'open', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK' }
  getDb().tables.loads = [load]
  getDb().tables.profiles = ['c1', 'e1', 'e2', 'e3'].map((id) => ({ id, role: id === 'c1' ? 'carrier' : 'escort', email: `${id}@example.com` }))
  getDb().sessionUser = null
  expect((await report(j('/api/loads/report', { loadId: L1, reason: 'scam' }))).status).toBe(401)
  getDb().sessionUser = { id: 'c1', email: 'c1@example.com' }
  expect((await report(j('/api/loads/report', { loadId: L1, reason: 'scam' }))).status).toBe(400)
  getDb().sessionUser = { id: 'e1', email: 'e1@example.com' }
  expect((await report(j('/api/loads/report', { loadId: L1, reason: 'made-up' }))).status).toBe(400)
  expect((await report(j('/api/loads/report', { loadId: L1, reason: 'scam' }))).status).toBe(200)
  expect((await report(j('/api/loads/report', { loadId: L1, reason: 'scam' }))).status).toBe(200)
  expect(getDb().tables.load_reports).toHaveLength(1)
  expect(getDb().tables.loads[0].status).toBe('open')
  getDb().sessionUser = { id: 'e2', email: 'e2@example.com' }
  await report(j('/api/loads/report', { loadId: L1, reason: 'spam' }))
  expect(getDb().tables.loads[0].status).toBe('open')
  getDb().sessionUser = { id: 'e3', email: 'e3@example.com' }
  await report(j('/api/loads/report', { loadId: L1, reason: 'fake_rate' }))
  expect(getDb().tables.loads[0].status).toBe('cancelled')
})
