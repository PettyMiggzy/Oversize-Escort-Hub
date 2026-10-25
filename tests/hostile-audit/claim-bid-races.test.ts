import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { POST as claim } from '@/app/api/loads/request/route'
import { POST as placeBid } from '@/app/api/bids/route'
import { POST as acceptBid } from '@/app/api/bids/accept/route'
import { GET as expireLoads } from '@/app/api/cron/expire-loads/route'

function jsonReq(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  resetHostile()
})

test('racing bids cannot both stay pending', async () => {
  const db = getDb()
  db.sessionUser = { id: 'escort-1', email: 'escort@example.com' }
  db.blindBidChecks = 2
  db.tables.profiles = [{ id: 'escort-1', role: 'escort', tier: 'pro', suspended: false }]
  db.tables.loads = [{
    id: 'load-bid',
    status: 'open',
    board_type: 'bid',
    carrier_id: 'carrier-1',
    created_at: new Date(Date.now() - 120_000).toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    deadhead_notified_at: null,
  }]

  const first = await placeBid(jsonReq('http://localhost/api/bids', { load_id: 'load-bid', rate: 2.5 }))
  const second = await placeBid(jsonReq('http://localhost/api/bids', { load_id: 'load-bid', rate: 3 }))
  const pending = (db.tables.bids ?? []).filter((b) => b.status === 'pending' && b.escort_id === 'escort-1')

  expect(first.status).toBe(200)
  expect({ status: second.status, pending: pending.length }).toEqual({ status: 409, pending: 1 })
})

test('accept loses when the bid was rejected first', async () => {
  const db = getDb()
  db.sessionUser = { id: 'carrier-1', email: 'carrier@example.com' }
  db.tables.loads = [{
    id: 'load-1',
    status: 'open',
    carrier_id: 'carrier-1',
    dl_city: 'Honolulu',
    dl_state: 'HI',
    board_type: 'bid',
  }]
  db.tables.bids = [{ id: 'bid-1', load_id: 'load-1', escort_id: 'escort-1', status: 'pending', rate: 2 }]
  db.tables.profiles = [
    { id: 'carrier-1', role: 'carrier', full_name: 'Carrier', phone: '8085550100', email: 'carrier@example.com' },
    { id: 'escort-1', role: 'escort', full_name: 'Escort', phone: '8085550101', email: 'escort@example.com' },
  ]
  // The reject commits after accept has read the bid and before accept writes it.
  db.onUpdate = (table, payload) => {
    if (table === 'loads' && payload.status === 'filled') {
      const bid = db.tables.bids.find((b) => b.id === 'bid-1')
      if (bid) bid.status = 'rejected'
    }
  }

  const res = await acceptBid(jsonReq('http://localhost/api/bids/accept', { load_id: 'load-1', bid_id: 'bid-1' }))
  const load = db.tables.loads[0]
  const bid = db.tables.bids[0]
  expect({ http: res.status, load: load.status, bid: bid.status }).toEqual({
    http: 409,
    load: 'open',
    bid: 'rejected',
  })
})

test('expire cron does not release a newer hold on the same load', async () => {
  const db = getDb()
  const fresh = new Date().toISOString()
  db.tables.loads = [{
    id: 'load-1',
    status: 'pending_match',
    matched_escort_id: 'escort-new',
    match_requested_at: fresh,
    carrier_id: 'carrier-1',
  }]
  db.selectResults = (table, filters) => {
    const holdScan = table === 'loads'
      && filters.some((f) => f.op === 'eq' && f.col === 'status' && f.val === 'pending_match')
      && filters.some((f) => f.op === 'lt' && f.col === 'match_requested_at')
    if (holdScan) return [{ id: 'load-1', matched_escort_id: 'escort-old' }]
    return null
  }

  const res = await expireLoads(new NextRequest('http://localhost/api/cron/expire-loads', {
    headers: { authorization: 'Bearer cron-test-secret' },
  }))
  expect(res.status).toBe(200)
  const load = db.tables.loads[0]
  expect({
    status: load.status,
    escort: load.matched_escort_id,
    pushes: db.pushes.length,
  }).toEqual({ status: 'pending_match', escort: 'escort-new', pushes: 0 })
})

test('expire cron does not tell an accepted escort the match expired', async () => {
  const db = getDb()
  db.tables.loads = [{
    id: 'load-1',
    status: 'filled',
    matched_escort_id: 'escort-accepted',
    match_requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    carrier_id: 'carrier-1',
  }]
  db.selectResults = (table, filters) => {
    const holdScan = table === 'loads'
      && filters.some((f) => f.op === 'lt' && f.col === 'match_requested_at')
    if (holdScan) return [{ id: 'load-1', matched_escort_id: 'escort-accepted' }]
    return null
  }

  await expireLoads(new NextRequest('http://localhost/api/cron/expire-loads', {
    headers: { authorization: 'Bearer cron-test-secret' },
  }))
  expect(db.tables.loads[0].status).toBe('filled')
  expect(db.pushes.map((p) => (p.payload as { data?: { type?: string } }).data?.type)).not.toContain('match_expired')
})
