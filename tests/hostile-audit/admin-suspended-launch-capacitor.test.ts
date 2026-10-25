import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { POST as claim } from '@/app/api/loads/request/route'
import { POST as placeBid } from '@/app/api/bids/route'
import { POST as postLoad } from '@/app/api/loads/route'

const root = path.resolve(__dirname, '../..')

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

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

test('admin queue queries do not run before the admin check', () => {
  const src = read('app/admin/page.tsx')
  const effect = src.slice(src.indexOf('useEffect(() => {'), src.indexOf('const setUserFields'))
  const afterInitCall = effect.slice(effect.indexOf('\n    init()'))
  expect(afterInitCall).not.toMatch(/from\(['"]certifications['"]\)|from\(['"]loads['"]\)|from\(['"]disputes['"]\)|from\(['"]sponsored_zones['"]\)/)
})

test('suspended escort cannot claim an open flat-rate load', async () => {
  const db = getDb()
  db.sessionUser = { id: 'escort-1', email: 'escort@example.com' }
  db.tables.profiles = [{ id: 'escort-1', role: 'escort', tier: 'pro', suspended: true }]
  db.tables.loads = [{
    id: 'load-1',
    status: 'open',
    carrier_id: 'carrier-1',
    board_type: 'flat-rate',
    created_at: new Date(Date.now() - 120_000).toISOString(),
    deadhead_notified_at: null,
    expires_at: null,
  }]
  const res = await claim(jsonReq('http://localhost/api/loads/request', { load_id: 'load-1' }))
  expect(res.status).toBe(403)
  expect(db.tables.loads[0].status).toBe('open')
})

test('suspended escort cannot place a bid', async () => {
  const db = getDb()
  db.sessionUser = { id: 'escort-1', email: 'escort@example.com' }
  db.tables.profiles = [{ id: 'escort-1', role: 'escort', tier: 'pro', suspended: true }]
  db.tables.loads = [{
    id: 'load-bid',
    status: 'open',
    board_type: 'bid',
    carrier_id: 'carrier-1',
    created_at: new Date(Date.now() - 120_000).toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    deadhead_notified_at: null,
  }]
  const res = await placeBid(jsonReq('http://localhost/api/bids', { load_id: 'load-bid', rate: 2 }))
  expect(res.status).toBe(403)
  expect(db.tables.bids ?? []).toEqual([])
})

test('suspended carrier cannot post a load', async () => {
  const db = getDb()
  db.sessionUser = { id: 'carrier-1', email: 'carrier@example.com' }
  db.tables.profiles = [{ id: 'carrier-1', role: 'carrier', tier: 'carrier_member', suspended: true }]
  const res = await postLoad(jsonReq('http://localhost/api/loads', {
    pickupCity: 'Honolulu',
    pickupState: 'HI',
    destinationCity: 'Hilo',
    destinationState: 'HI',
    escortType: 'steer',
    boardType: 'flat-rate',
  }))
  expect(res.status).toBe(403)
  expect(db.tables.loads ?? []).toEqual([])
})

test('dashboard deadhead list uses the free-launch tier', () => {
  const src = read('app/dashboard/_client.tsx')
  const start = src.indexOf('Deadhead exclusive window')
  const block = src.slice(start, src.indexOf('setDeadheadOpps', start))
  expect(block).toMatch(/effectiveTier\s*\(|withFreeLaunch\s*\(/)
  expect(block).not.toMatch(/deadheadTiers\.has\(prof\.tier\)/)
})

test('capacitor shell and in-app browser use the same host', () => {
  const config = read('capacitor.config.ts')
  const native = read('lib/native.ts')
  const serverUrl = config.match(/url:\s*['"]([^'"]+)['"]/)?.[1]
  const webHost = native.match(/WEB_HOST = ['"]([^'"]+)['"]/)?.[1]
  expect(serverUrl).toBeTruthy()
  expect(webHost).toBeTruthy()
  expect(new URL(serverUrl!).host).toBe(new URL(webHost!).host)
})

test('android release signing secrets are not inline and the keystore is not in the repo', () => {
  const gradle = read('android/app/build.gradle')
  const inlineSecret = /^\s*(storePassword|keyPassword)\s+['"][^'"]+['"]/m.test(gradle)
  expect(inlineSecret).toBe(false)
  expect(fs.existsSync(path.join(root, 'android/oeh-release.keystore'))).toBe(false)
})

test('android backup does not include the webview session', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml')
  expect(manifest).not.toMatch(/android:allowBackup="true"/)
})
