import { beforeEach, expect, test } from 'vitest'
import { readFileSync } from 'fs'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { piecesFromRow, shareText, shareSummary, loadLink } from '@/lib/share-text'
import { getShareLoad, isOpenToShare } from '@/lib/share-load'
import { POST as postLoad } from '@/app/api/loads/route'

const ID = '11111111-2222-4333-8444-555555555555'
const row = (extra: Record<string, unknown> = {}) => ({ id: ID, status: 'open', board_type: 'flat-rate', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', per_mile_rate: 2, estimated_miles: 260, start_date: '2026-11-10', escort_type: 'Lead', escort_count: 1, urgent: false, expires_at: new Date(Date.now() + 86400000).toISOString(), notes: 'Wide load, call me', carrier_id: 'c1', ...extra })

beforeEach(() => resetHostile())

test('share text says route, rate, miles, total and date, never more', () => {
  const p = piecesFromRow(row())
  expect(p.route).toBe('Dallas, TX to Tulsa, OK')
  expect(p.rate).toBe('$2.00/mi')
  expect(p.total).toBe(520)
  expect(shareSummary(p)).toBe('Lead · $2.00/mi · about 260 mi · about $520 total · needed 2026-11-10')
  expect(shareText(p)).toContain('Free to claim or bid on Oversize Escort Hub')
  expect(shareText({ ...p, urgent: true })).toMatch(/^URGENT\./)
  expect(loadLink(ID)).toBe(`https://www.oversize-escort-hub.com/l/${ID}`)
  expect(piecesFromRow(row({ per_mile_rate: null, estimated_miles: null })).total).toBeNull()
})

test('the public card reads no names, notes or contact details, and hides test loads and bad ids', async () => {
  getDb().tables.loads = [row(), row({ id: '22222222-2222-4333-8444-555555555555', notes: 'ZZTEST DEMO LOAD' })]
  const l = await getShareLoad(ID)
  expect(l).not.toBeNull()
  expect(JSON.stringify(l)).not.toMatch(/call me|carrier_id|c1|@/)
  expect(isOpenToShare(l!)).toBe(true)
  expect(await getShareLoad('22222222-2222-4333-8444-555555555555')).toBeNull()
  expect(await getShareLoad('not-a-uuid')).toBeNull()
  expect(await getShareLoad("1' or '1'='1")).toBeNull()
  getDb().tables.loads = [row({ status: 'filled' })]
  expect(isOpenToShare((await getShareLoad(ID))!)).toBe(false)
})

test('a load can ask to stay posted up to a week, no longer', async () => {
  const db = getDb()
  db.tables.profiles = [{ id: 'c1', role: 'carrier', suspended: false, email: 'c@example.com' }]
  db.sessionUser = { id: 'c1', email: 'c@example.com' }
  const body = { pickupCity: 'Dallas', pickupState: 'TX', destinationCity: 'Tulsa', destinationState: 'OK', escortType: 'Lead', boardType: 'flat-rate', rate: 2 }
  const mk = (expiresAt: string) => new NextRequest('http://x/api/loads', { method: 'POST', body: JSON.stringify({ ...body, expiresAt }), headers: { 'content-type': 'application/json' } })
  expect((await postLoad(mk(new Date(Date.now() + 6 * 86400000).toISOString()))).status).toBe(201)
  const week = (Date.parse((db.tables.loads[0] as any).expires_at) - Date.now()) / 86400000
  expect(week).toBeGreaterThan(5.9)
  await postLoad(mk(new Date(Date.now() + 20 * 86400000).toISOString()))
  const fallback = (Date.parse((db.tables.loads[1] as any).expires_at) - Date.now()) / 86400000
  expect(fallback).toBeLessThan(1.1)
})

test('the share page is public, the load pages carry a share link, and the form offers the days', () => {
  expect(readFileSync('middleware.ts', 'utf8')).not.toMatch(/'\/l'/)
  expect(readFileSync('app/l/[id]/page.tsx', 'utf8')).toContain('Claim this load')
  expect(readFileSync('app/l/[id]/opengraph-image.tsx', 'utf8')).toContain('Free to claim or bid')
  for (const f of ['app/flat-rate/_client.tsx', 'app/open-loads/_client.tsx', 'app/dashboard/_client.tsx', 'app/loads/[id]/page.tsx']) expect(readFileSync(f, 'utf8')).toContain('<ShareLoad')
  expect(readFileSync('app/post-load/_client.tsx', 'utf8')).toContain('Keep it posted for')
})
