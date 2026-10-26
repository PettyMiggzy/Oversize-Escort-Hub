import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { alertWelcome, alertWeeklyDigest } from '@/lib/alerts'
import { GET as digestCron } from '@/app/api/cron/weekly-digest/route'

const sent: { to: string; subject: string }[] = []

beforeEach(() => {
  resetHostile()
  sent.length = 0
  process.env.RESEND_API_KEY = 'test-key'
  process.env.CRON_SECRET = 'cron-secret'
  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    const b = JSON.parse(String(init?.body ?? '{}'))
    sent.push({ to: b.to, subject: b.subject })
    return new Response('{}', { status: 200 })
  })
  vi.useFakeTimers({ toFake: ['setTimeout'] })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); delete process.env.RESEND_API_KEY })

async function run<T>(p: Promise<T>): Promise<T> {
  const out = p
  await vi.runAllTimersAsync()
  return out
}

test('the welcome email goes out once per account and says what to do next', async () => {
  getDb().tables.profiles = [{ id: 'e1', role: 'escort', email: 'e1@example.com', full_name: 'E One', email_alerts: true }]
  expect(await run(alertWelcome('e1'))).toBe(true)
  expect(await run(alertWelcome('e1'))).toBe(false)
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ to: 'e1@example.com', subject: 'Welcome to Oversize Escort Hub' })
  expect((getDb().tables.notifications ?? []).filter((n) => String(n.message).startsWith('Welcome'))).toHaveLength(1)
})

test('the weekly digest only goes to escorts with new open loads in their states, and respects opt-out', async () => {
  const now = new Date().toISOString()
  getDb().tables.loads = [
    { id: 'l1', status: 'open', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', per_mile_rate: 2.5, created_at: now },
    { id: 'l2', status: 'open', pu_city: 'Old', pu_state: 'TX', dl_city: 'Old', dl_state: 'TX', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
    { id: 'l3', status: 'filled', pu_city: 'Gone', pu_state: 'TX', dl_city: 'Gone', dl_state: 'TX', created_at: now },
  ]
  getDb().tables.profiles = [
    { id: 'tx', role: 'escort', email: 'tx@example.com', availability_states: ['TX'], email_alerts: true },
    { id: 'wa', role: 'escort', email: 'wa@example.com', availability_states: ['WA'], email_alerts: true },
    { id: 'any', role: 'escort', email: 'any@example.com', availability_states: [], email_alerts: true },
    { id: 'off', role: 'escort', email: 'off@example.com', availability_states: ['TX'], email_alerts: false },
    { id: 'sus', role: 'escort', email: 'sus@example.com', availability_states: ['TX'], suspended: true },
    { id: 'car', role: 'carrier', email: 'car@example.com' },
  ]
  const r = await run(alertWeeklyDigest())
  expect(sent.map((s) => s.to).sort()).toEqual(['any@example.com', 'tx@example.com'])
  expect(r.sent).toBe(2)
  expect(sent[0].subject).toMatch(/1 open load/)
})

test('the digest does nothing when there are no new loads', async () => {
  getDb().tables.loads = []
  getDb().tables.profiles = [{ id: 'tx', role: 'escort', email: 'tx@example.com', availability_states: ['TX'] }]
  expect((await run(alertWeeklyDigest())).sent).toBe(0)
  expect(sent).toHaveLength(0)
})

test('the digest cron refuses callers without the cron secret', async () => {
  const denied = await digestCron(new NextRequest('http://localhost/api/cron/weekly-digest'))
  expect(denied.status).toBeGreaterThanOrEqual(401)
  expect(sent).toHaveLength(0)
  const ok = await run(digestCron(new NextRequest('http://localhost/api/cron/weekly-digest', { headers: { authorization: 'Bearer cron-secret' } })))
  expect(ok.status).toBe(200)
})
