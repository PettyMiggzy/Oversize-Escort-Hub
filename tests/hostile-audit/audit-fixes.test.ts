import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { requireAuth } from '@/lib/api-auth'
import { POST as setUser } from '@/app/api/admin/set-user/route'

const read = (rel: string) => fs.readFileSync(path.resolve(__dirname, '../..', rel), 'utf8')

beforeEach(() => resetHostile())

test('the browser never writes fmcsa_verified on the profile', () => {
  const src = read('app/dashboard/_client.tsx')
  const fn = src.slice(src.indexOf('const handleMarkFmcsaVerified'), src.indexOf('const handleMarkFmcsaVerified') + 900)
  expect(fn).not.toMatch(/fmcsa_verified\s*:\s*true/)
})

test('a suspended account is refused by requireAuth', async () => {
  const db = getDb()
  db.sessionUser = { id: 'u1', email: 'u1@example.com' }
  db.tables.profiles = [{ id: 'u1', role: 'escort', suspended: true }]
  const r = await requireAuth()
  expect(r.error?.status).toBe(403)
  db.tables.profiles = [{ id: 'u1', role: 'escort', suspended: false }]
  expect((await requireAuth()).error).toBeNull()
})

test('suspending a user also bans their sign-in, lifting it unbans', async () => {
  const db = getDb()
  db.sessionUser = { id: 'adm', email: (process.env.ADMIN_EMAILS || 'admin@example.com').split(',')[0].trim() }
  db.tables.profiles = [{ id: 'adm', role: 'admin' }, { id: 'u1', role: 'escort', suspended: false }]
  const mk = (suspended: boolean) => new NextRequest('http://x/api/admin/set-user', { method: 'POST', body: JSON.stringify({ userId: 'u1', suspended }), headers: { 'content-type': 'application/json' } })
  expect((await setUser(mk(true))).status).toBe(200)
  expect(db.authOps.some((o) => o.op === 'updateUserById' && (o.attrs as { ban_duration?: string }).ban_duration !== 'none')).toBe(true)
  expect((await setUser(mk(false))).status).toBe(200)
  expect(db.authOps.some((o) => o.op === 'updateUserById' && (o.attrs as { ban_duration?: string }).ban_duration === 'none')).toBe(true)
})

import { POST as invoicePdf } from '@/app/api/invoices/generate/route'

test('the invoice PDF is refused until the match is confirmed (filled)', async () => {
  const db = getDb()
  db.sessionUser = { id: 'carrier', email: 'c@example.com' }
  db.tables.profiles = [{ id: 'carrier', role: 'carrier' }]
  db.tables.loads = [
    { id: 'l-pending', status: 'pending_match', carrier_id: 'carrier', matched_escort_id: 'escort' },
    { id: 'l-open', status: 'open', carrier_id: 'carrier', matched_escort_id: null },
  ]
  for (const id of ['l-pending', 'l-open']) {
    const res = await invoicePdf(new NextRequest('http://x/api/invoices/generate', { method: 'POST', body: JSON.stringify({ load_id: id }), headers: { 'content-type': 'application/json' } }))
    expect(res.status).toBe(409)
  }
})

test('invoice create writes only columns the invoices table has', () => {
  const src = read('app/api/invoices/create/route.ts')
  const ins = src.slice(src.indexOf('.insert({'), src.indexOf('.select("id")'))
  expect(ins).not.toMatch(/description|due_date|items/)
})

test('account delete identity update does not name a column the profiles table lacks', () => {
  const src = read('app/api/account/delete/route.ts')
  expect(src).not.toMatch(/push_token/)
})

test('wraith checks the usage insert so its limits cannot silently stop counting', () => {
  const src = read('app/api/wraith/route.ts')
  expect(src).toMatch(/const \{ error: usageErr \} = await svc\.from\('helper_usage'\)\.insert/)
})
