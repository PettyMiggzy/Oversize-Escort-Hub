import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { GET as listBlocks, POST as blockUser } from '@/app/api/blocks/route'
import { POST as reportUser } from '@/app/api/users/report/route'
import { isBlockedEitherWay } from '@/lib/blocks'
import { serviceClient } from '@/lib/service-client'

const ME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const THEM = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const j = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

beforeEach(() => {
  resetHostile()
  getDb().sessionUser = { id: ME, email: 'me@x.example' }
  getDb().tables.profiles = [{ id: ME, role: 'carrier', full_name: 'Me' }, { id: THEM, role: 'escort', full_name: 'Them' }]
})

test('blocking needs a login, a real user and not yourself', async () => {
  expect((await blockUser(j('/api/blocks', { userId: THEM, action: 'block' }))).status).toBe(200)
  expect((await blockUser(j('/api/blocks', { userId: ME, action: 'block' }))).status).toBe(400)
  expect((await blockUser(j('/api/blocks', { userId: 'nope', action: 'block' }))).status).toBe(400)
  expect((await blockUser(j('/api/blocks', { userId: THEM, action: 'zap' }))).status).toBe(400)
  expect((await blockUser(j('/api/blocks', { userId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', action: 'block' }))).status).toBe(404)
  getDb().sessionUser = null
  expect((await blockUser(j('/api/blocks', { userId: THEM, action: 'block' }))).status).toBe(401)
  expect((await listBlocks()).status).toBe(401)
})

test('a block hides both people from each other and can be undone; blocking twice stores one row', async () => {
  await blockUser(j('/api/blocks', { userId: THEM, action: 'block' }))
  await blockUser(j('/api/blocks', { userId: THEM, action: 'block' }))
  expect(getDb().tables.user_blocks).toHaveLength(1)
  const mine = await (await listBlocks()).json()
  expect(mine.blocked).toEqual([{ id: THEM, name: 'Them' }])
  expect(mine.hidden).toEqual([THEM])
  // the other person sees the block too, but only as an id to hide (no name)
  getDb().sessionUser = { id: THEM, email: 't@x.example' }
  const theirs = await (await listBlocks()).json()
  expect(theirs.blocked).toEqual([])
  expect(theirs.hidden).toEqual([ME])
  expect(await isBlockedEitherWay(serviceClient(), ME, THEM)).toBe(true)
  expect(await isBlockedEitherWay(serviceClient(), THEM, ME)).toBe(true)
  getDb().sessionUser = { id: ME, email: 'me@x.example' }
  await blockUser(j('/api/blocks', { userId: THEM, action: 'unblock' }))
  expect(await isBlockedEitherWay(serviceClient(), ME, THEM)).toBe(false)
})

test('reporting a user: reason required, not yourself, one report per pair', async () => {
  expect((await reportUser(j('/api/users/report', { userId: THEM, reason: 'bogus' }))).status).toBe(400)
  expect((await reportUser(j('/api/users/report', { userId: ME, reason: 'spam' }))).status).toBe(400)
  expect((await reportUser(j('/api/users/report', { userId: THEM, reason: 'harassment', details: 'x'.repeat(900) }))).status).toBe(200)
  expect((await reportUser(j('/api/users/report', { userId: THEM, reason: 'spam' }))).status).toBe(200)
  expect(getDb().tables.user_reports).toHaveLength(1)
  expect(String(getDb().tables.user_reports[0].details).length).toBe(500)
  getDb().sessionUser = null
  expect((await reportUser(j('/api/users/report', { userId: THEM, reason: 'spam' }))).status).toBe(401)
})

test('every route that connects two people refuses a blocked pair', async () => {
  const fs = await import('node:fs')
  for (const f of ['app/api/bids/route.ts', 'app/api/loads/request/route.ts', 'app/api/bids/accept/route.ts', 'app/api/loads/match/route.ts', 'app/api/reviews/route.ts', 'app/api/contact/party/route.ts']) {
    expect(fs.readFileSync(f, 'utf8'), f).toContain('isBlockedEitherWay')
  }
  expect(fs.readFileSync('app/escorts/[id]/page.tsx', 'utf8')).toContain('isBlockedEitherWay')
})
