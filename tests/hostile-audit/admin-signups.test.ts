import { beforeEach, expect, test } from 'vitest'
import { getDb, resetHostile } from './mock-client'
import { GET } from '@/app/api/admin/signups/route'

const ago = (d: number) => new Date(Date.now() - d * 86400000 - 60_000).toISOString()

beforeEach(() => {
  resetHostile()
  getDb().tables.profiles = [
    { id: 'e1', role: 'escort', created_at: ago(0), email: 'e1@example.com' },
    { id: 'e2', role: 'escort', created_at: ago(0), email: 'e2@example.com' },
    { id: 'c1', role: 'carrier', created_at: ago(3), email: 'c1@example.com' },
    { id: 'x1', role: 'something_else', created_at: ago(4), email: 'x@example.com' },
    { id: 'old', role: 'escort', created_at: ago(60), email: 'old@example.com' },
    { id: 'a1', role: 'admin', created_at: ago(0), email: 'admin@example.com' },
  ]
})

test('refuses signed-out and non-admin callers', async () => {
  getDb().sessionUser = null
  expect((await GET()).status).toBe(401)
  getDb().sessionUser = { id: 'e1', email: 'e1@example.com' }
  expect((await GET()).status).toBe(403)
})

test('admin gets only counts: 30 days, admins and old accounts left out', async () => {
  getDb().sessionUser = { id: 'a1', email: 'admin@example.com' }
  const res = await GET()
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.days).toHaveLength(30)
  expect(body.last30).toBe(4)
  expect(body.last7).toBe(4)
  expect(body.bestDay).toBe(2)
  expect(body.days.reduce((a: number, d: { total: number }) => a + d.total, 0)).toBe(4)
  expect(body.days.some((d: { other: number }) => d.other === 1)).toBe(true)
  expect(JSON.stringify(body)).not.toContain('@')
})
