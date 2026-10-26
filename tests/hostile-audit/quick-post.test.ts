import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { POST as start } from '@/app/api/quick-post/route'
import { POST as confirm } from '@/app/api/quick-post/confirm/route'
import { POST as setPassword } from '@/app/api/quick-post/password/route'
import { hashToken } from '@/lib/quick-post'

const good = {
  email: 'Dispatch@Carrier.example', name: 'Dana Dispatch', company: 'Big Haul LLC', phone: '(555) 010-2000',
  pickupCity: 'Dallas', pickupState: 'tx', destinationCity: 'Tulsa', destinationState: 'OK',
  escortType: 'Lead', escortCount: 2, boardType: 'flat-rate', rate: 2.5,
  dateNeeded: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), notes: 'Wide load <script>', website: '',
  startedAt: Date.now() - 10000,
}
const req = (path: string, body: unknown, ip = '9.9.9.9') => new NextRequest(`http://localhost${path}`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body),
})
const draft = () => (getDb().tables.quick_post_drafts ?? [])[0]
/** Start a post and return the raw token by brute force: tests create the token themselves instead of reading the email. */
function plantDraft(token: string, over: Record<string, unknown> = {}) {
  getDb().tables.quick_post_drafts = [{
    id: 'd1', token_hash: hashToken(token), email: 'dispatch@carrier.example', created_at: new Date().toISOString(), used_at: null, user_id: null, password_set_at: null,
    payload: { name: 'Dana Dispatch', company: 'Big Haul LLC', phone: '5550102000', pickupCity: 'Dallas', pickupState: 'TX', destinationCity: 'Tulsa', destinationState: 'OK', escortType: 'Lead', escortCount: 2, boardType: 'flat-rate', rate: 2.5, dateNeeded: null, notes: '' },
    ...over,
  }]
}
const T = 'a'.repeat(64)

beforeEach(() => { resetHostile() })

test('posting stores a draft only: no load exists until the email link is used', async () => {
  const res = await start(req('/api/quick-post', good))
  expect(res.status).toBe(200)
  expect(getDb().tables.loads ?? []).toHaveLength(0)
  expect(getDb().tables.quick_post_drafts).toHaveLength(1)
  expect(draft().email).toBe('dispatch@carrier.example')
  expect(String(draft().token_hash)).toHaveLength(64)
  expect(JSON.stringify(draft())).not.toContain('<script>')
  expect(getDb().authOps).toHaveLength(0)
})

test('bots are stopped: hidden field, instant submit, bad input', async () => {
  expect((await start(req('/api/quick-post', { ...good, website: 'http://spam' }))).status).toBe(200)
  expect(getDb().tables.quick_post_drafts ?? []).toHaveLength(0)
  expect((await start(req('/api/quick-post', { ...good, startedAt: Date.now() }))).status).toBe(400)
  expect((await start(req('/api/quick-post', { ...good, rate: 900 }))).status).toBe(400)
  expect((await start(req('/api/quick-post', { ...good, pickupState: 'ZZ' }))).status).toBe(400)
  expect((await start(req('/api/quick-post', { ...good, email: 'nope' }))).status).toBe(400)
  expect((await start(req('/api/quick-post', { ...good, dateNeeded: '2001-01-01' }))).status).toBe(400)
})

test('one email gets 3 drafts a day and one connection gets 5 an hour', async () => {
  for (let i = 0; i < 3; i++) expect((await start(req('/api/quick-post', good, `1.1.1.${i}`))).status).toBe(200)
  expect((await start(req('/api/quick-post', good, '1.1.1.9'))).status).toBe(429)
  resetHostile()
  for (let i = 0; i < 5; i++) expect((await start(req('/api/quick-post', { ...good, email: `p${i}@x.example` }))).status).toBe(200)
  expect((await start(req('/api/quick-post', { ...good, email: 'p9@x.example' }))).status).toBe(429)
})

test('confirming creates a carrier account and the open load, once', async () => {
  plantDraft(T)
  const res = await confirm(req('/api/quick-post/confirm', { t: T }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.newAccount).toBe(true)
  const loads = getDb().tables.loads ?? []
  expect(loads).toHaveLength(1)
  expect(loads[0]).toMatchObject({ pu_state: 'TX', dl_state: 'OK', status: 'open', board_type: 'flat-rate', per_mile_rate: 2.5, escort_count: 2, poster_company: 'Big Haul LLC' })
  expect(JSON.stringify(loads[0])).not.toContain('5550102000')
  const created = getDb().authOps.find((o) => o.op === 'createUser') as { attrs: { email: string; email_confirm: boolean; user_metadata: { role: string } } }
  expect(created.attrs).toMatchObject({ email: 'dispatch@carrier.example', email_confirm: true })
  expect(created.attrs.user_metadata.role).toBe('carrier')
  expect(getDb().tables.profiles[0].phone).toBe('5550102000')
  // the link is single-use
  expect((await confirm(req('/api/quick-post/confirm', { t: T }))).status).toBe(410)
  expect(getDb().tables.loads).toHaveLength(1)
})

test('an expired or unknown link posts nothing', async () => {
  plantDraft(T, { created_at: new Date(Date.now() - 25 * 3600000).toISOString() })
  expect((await confirm(req('/api/quick-post/confirm', { t: T }))).status).toBe(410)
  expect((await confirm(req('/api/quick-post/confirm', { t: 'b'.repeat(64) }))).status).toBe(410)
  expect((await confirm(req('/api/quick-post/confirm', { t: 'short' }))).status).toBe(400)
  expect(getDb().tables.loads ?? []).toHaveLength(0)
})

test('an escort or suspended account cannot be used to post', async () => {
  plantDraft(T)
  getDb().tables.profiles = [{ id: 'esc', email: 'dispatch@carrier.example', role: 'escort' }]
  expect((await confirm(req('/api/quick-post/confirm', { t: T }))).status).toBe(409)
  plantDraft(T)
  getDb().tables.profiles = [{ id: 'c1', email: 'dispatch@carrier.example', role: 'carrier', suspended: true }]
  expect((await confirm(req('/api/quick-post/confirm', { t: T }))).status).toBe(403)
  expect(getDb().tables.loads ?? []).toHaveLength(0)
})

test('an existing carrier gets the load on their account, and one account cannot hold more than 5 open loads', async () => {
  plantDraft(T)
  getDb().tables.profiles = [{ id: 'c1', email: 'DISPATCH@carrier.example', role: 'carrier' }]
  const ok = await confirm(req('/api/quick-post/confirm', { t: T }))
  expect(ok.status).toBe(200)
  expect((await ok.json()).newAccount).toBe(false)
  expect(getDb().tables.loads[0].carrier_id).toBe('c1')
  expect(getDb().authOps.find((o) => o.op === 'createUser')).toBeUndefined()
  getDb().tables.loads = Array.from({ length: 5 }, (_, i) => ({ id: `l${i}`, carrier_id: 'c1', status: 'open' }))
  plantDraft(T)
  expect((await confirm(req('/api/quick-post/confirm', { t: T }))).status).toBe(429)
})

test('a password can be set once, only for an account this link created', async () => {
  plantDraft(T)
  await confirm(req('/api/quick-post/confirm', { t: T }))
  expect((await setPassword(req('/api/quick-post/password', { t: T, password: 'short' }))).status).toBe(400)
  expect((await setPassword(req('/api/quick-post/password', { t: T, password: 'a-long-enough-password' }))).status).toBe(200)
  expect(getDb().authOps.some((o) => o.op === 'updateUserById')).toBe(true)
  expect((await setPassword(req('/api/quick-post/password', { t: T, password: 'another-long-password' }))).status).toBe(410)
  // an existing account's link can never change its password
  resetHostile()
  plantDraft(T)
  getDb().tables.profiles = [{ id: 'c1', email: 'dispatch@carrier.example', role: 'carrier' }]
  await confirm(req('/api/quick-post/confirm', { t: T }))
  expect((await setPassword(req('/api/quick-post/password', { t: T, password: 'a-long-enough-password' }))).status).toBe(410)
  expect(getDb().authOps.some((o) => o.op === 'updateUserById')).toBe(false)
})
