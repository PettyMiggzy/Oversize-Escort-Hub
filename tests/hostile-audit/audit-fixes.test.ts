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

import { POST as contactPost } from '@/app/api/contact/route'
import { POST as waitlistPost } from '@/app/api/notify-launch/route'
import { requireCron } from '@/lib/api-auth'

const ipReq = (url: string, body: unknown, ip = '9.9.9.9') =>
  new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-forwarded-for': ip } })

test('the contact form is limited per caller address', async () => {
  const body = { name: 'A', email: 'a@example.com', message: 'hello' }
  const codes: number[] = []
  for (let i = 0; i < 7; i++) codes.push((await contactPost(ipReq('http://x/api/contact', body))).status)
  expect(codes.slice(0, 5).every((c) => c !== 429)).toBe(true)
  expect(codes[6]).toBe(429)
  // another address is not affected
  expect((await contactPost(ipReq('http://x/api/contact', body, '8.8.8.8'))).status).not.toBe(429)
})

test('the waitlist is limited per caller address and takes no anon-key fallback', async () => {
  expect(read('app/api/notify-launch/route.ts')).not.toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  const codes: number[] = []
  for (let i = 0; i < 12; i++) codes.push((await waitlistPost(ipReq('http://x/api/notify-launch', { email: `w${i}@example.com` }))).status)
  expect(codes[11]).toBe(429)
})

test('the open proxy routes are rate limited and NWS follow-up URLs are pinned to api.weather.gov', () => {
  for (const f of ['weather', 'nws', 'fmcsa', 'check-trial']) expect(read(`app/api/${f}/route.ts`)).toMatch(/ipLimited\(/)
  expect(read('app/api/weather/route.ts')).toMatch(/startsWith\("https:\/\/api\.weather\.gov\/"\)/)
  expect(read('app/api/nws/route.ts')).toMatch(/startsWith\('https:\/\/api\.weather\.gov\/'\)/)
})

test('the deadhead email escapes the load text', () => {
  const src = read('lib/deadhead.ts')
  const html = src.slice(src.indexOf('html: `'), src.indexOf('html: `') + 700)
  expect(html).not.toMatch(/\$\{load\.(escort_type|pu_city|pu_state|dl_city|dl_state)\}/)
  expect(html).toMatch(/escapeHtml\(load\.escort_type\)/)
})

test('requireCron compares in constant time and still refuses a wrong or missing secret', () => {
  process.env.CRON_SECRET = 'right-secret'
  const mk = (h: Record<string, string>) => new Request('http://x/cron', { headers: h })
  expect(requireCron(mk({ authorization: 'Bearer right-secret' }))).toBeNull()
  expect(requireCron(mk({ 'x-cron-secret': 'right-secret' }))).toBeNull()
  expect(requireCron(mk({ authorization: 'Bearer wrong' }))?.status).toBe(401)
  expect(requireCron(mk({}))?.status).toBe(401)
  expect(read('lib/api-auth.ts')).toMatch(/safeEqual\(/)
})

test('the expire-loads cron answers 500 when a step failed', () => {
  expect(read('app/api/cron/expire-loads/route.ts')).toMatch(/status: ok \? 200 : 500/)
})

test('native/web switches fail closed: assumed phone app until the browser proves otherwise', () => {
  for (const f of ['components/HideInApp.tsx', 'components/BoardAdSidebar.tsx']) expect(read(f), f).toMatch(/useState\(true\)/)
  expect(read('components/WebOnly.tsx')).toMatch(/useState<boolean \| null>\(null\)/)
  expect(read('components/WebOnly.tsx')).toMatch(/native === null\) return null/)
  for (const f of ['app/pricing/page.tsx', 'app/features/page.tsx', 'app/find-escorts/page.tsx', 'app/page.tsx', 'app/flat-rate/_client.tsx', 'app/dashboard/_client.tsx']) {
    expect(read(f), f).toMatch(/const \[inApp, setInApp\] = useState\(true\)/)
  }
  expect(read('app/features/page.tsx')).not.toMatch(/\$99\.99/)
})

test('sign-in honors next as well as redirect', () => {
  expect(read('app/signin/page.tsx')).toMatch(/searchParams\.get\('redirect'\) \?\? searchParams\.get\('next'\)/)
})

import { POST as deleteAccount } from '@/app/api/account/delete/route'

test('account delete also cancels a Wraith Pro subscription and removes its row', async () => {
  const db = getDb()
  db.sessionUser = { id: 'user-1', email: 'user@example.com' }
  db.tables.profiles = [{ id: 'user-1', role: 'escort', tier: 'free', email: 'user@example.com' }]
  db.tables.wraith_access = [{ user_id: 'user-1', status: 'active', stripe_subscription_id: 'sub_wraith', stripe_customer_id: 'cus_wraith' }]
  const res = await deleteAccount(new NextRequest('http://x/api/account/delete', { method: 'POST', body: JSON.stringify({ confirm: 'DELETE' }), headers: { 'content-type': 'application/json' } }))
  expect(res.status).toBe(200)
  expect(db.stripeCalls).toEqual(expect.arrayContaining([expect.objectContaining({ op: 'cancel', id: 'sub_wraith' })]))
  expect(db.tables.wraith_access).toHaveLength(0)
})

test('Stripe return addresses never come from the Origin header; veteran coupon stays behind the switch; a held zone is not granted twice', () => {
  for (const f of ['app/api/checkout/route.ts', 'app/api/wraith/checkout/route.ts', 'app/api/wraith/portal/route.ts']) {
    expect(read(f), f).not.toMatch(/headers\.get\(['"]origin['"]\)/i)
  }
  expect(read('app/api/checkout/route.ts')).toMatch(/!oneTime && VERIFICATION_LIVE/)
  expect(read('app/api/webhook/route.ts')).toMatch(/already held, NOT granted/)
})

test('public escort pages and the finder hide suspended and non-escort accounts, and name nothing as checked', () => {
  const page = read('app/escorts/[id]/page.tsx')
  expect(page).toMatch(/profile\.role !== 'escort' \|\| profile\.suspended === true/)
  expect(page).not.toMatch(/escort_availability'\)\.select\('\*'\)/)
  const finder = read('app/find-escorts/page.tsx')
  expect(finder).toMatch(/suspended\.is\.null,suspended\.eq\.false/)
  expect(finder).toMatch(/Certs \(listed by the escort, not checked by us\)/)
  expect(read('app/terms/page.tsx')).not.toMatch(/allows licensed P\/EVO/)
})

test('a pull-request workflow runs the type check and the hostile suite, and keystores stay ignored', () => {
  const wf = read('.github/workflows/checks.yml')
  expect(wf).toMatch(/pull_request:\s*\n\s*branches: \[main\]/)
  expect(wf).toMatch(/npx tsc --noEmit/)
  expect(wf).toMatch(/npm run test:hostile/)
  expect(read('.gitignore')).toMatch(/^\*\.keystore$/m)
  expect(read('android/.gitignore')).toMatch(/^\*\.keystore$/m)
})

test('a Content-Security-Policy ships in report-only mode and allows Supabase and Stripe', () => {
  const cfg = read('next.config.ts')
  expect(cfg).toMatch(/Content-Security-Policy-Report-Only/)
  expect(cfg).toMatch(/\*\.supabase\.co/)
  expect(cfg).toMatch(/js\.stripe\.com/)
  expect(cfg).toMatch(/object-src 'none'/)
})
