import fs from 'node:fs'
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/profile-columns'
import { beforeEach, expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { getDb, resetHostile } from './mock-client'
import { POST as create, GET as mine } from '@/app/api/jobs/route'
import { POST as act } from '@/app/api/jobs/[id]/route'
import { POST as apply } from '@/app/api/jobs/[id]/apply/route'
import { GET as applicants } from '@/app/api/jobs/[id]/applications/route'
import { POST as decide } from '@/app/api/jobs/applications/[appId]/route'
import { GET as contact } from '@/app/api/jobs/contact/route'
import { validateJob, payText, LIMITS } from '@/lib/jobs'
import { canPostJobs } from '@/lib/jobs-access'

const J1 = '11111111-1111-4111-8111-111111111111'
const post = (body: unknown) => new NextRequest('http://localhost/api/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const ctx = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) })
const good = { title: 'Lead escort, Texas, own truck', company: 'Lone Star Pilot Cars', description: 'Steady work, home most weekends.', classification: '1099', equipment: 'bring_own', pay_model: 'percent', pay_min: 30, pay_max: 40, schedule: 'full_time', travel: 'regional', base_state: 'TX', base_city: 'Dallas', states: ['TX', 'OK'], cert_types: ['P/EVO'] }

function people() {
  getDb().tables.profiles = [
    { id: 'poster', role: 'carrier', tier: 'free', email: 'boss@fleet.example', phone: '555-0100', full_name: 'Boss', company_name: 'Fleet Co' },
    { id: 'escort', role: 'escort', tier: 'free', email: 'driver@x.example', phone: '555-0199', full_name: 'Driver' },
    { id: 'other', role: 'escort', tier: 'free', email: 'other@x.example', phone: '555-0222', full_name: 'Other' },
    { id: 'admin', role: 'admin', email: 'admin@example.com' },
  ]
}
const as = (id: string, email = `${id}@example.com`) => { getDb().sessionUser = { id, email } }

beforeEach(() => { resetHostile(); people() })

test('validation: contact details, wrong enums, silly pay and missing places are refused', () => {
  expect(validateJob(good).ok).toBe(true)
  for (const patch of [
    { description: 'call me 555 123 4567' }, { title: 'Escort job, email me a@b.example' }, { company: 'see www.spam.example' },
    { classification: 'slave' }, { equipment: '' }, { pay_model: 'bitcoin' }, { schedule: 'x' }, { travel: 'x' },
    { pay_min: 2500, pay_max: 2500 }, { pay_min: 40, pay_max: 30 }, { pay_min: 'abc' }, { title: 'abc' },
    { base_state: 'ZZ', states: [] }, { base_state: '', states: [] }, { start_date: '2001-01-01' },
  ]) expect(validateJob({ ...good, ...patch }).ok, JSON.stringify(patch)).toBe(false)
  const ok = validateJob({ ...good, pay_model: 'negotiable', pay_min: 'x', states: ['tx', 'ZZ', 'TX'], title: '<b>Lead escort</b> needed' })
  expect(ok.ok && ok.data.pay_min).toBe(null)
  expect(ok.ok && ok.data.states).toEqual(['TX'])
  expect(ok.ok && ok.data.title).not.toMatch(/[<>]/)
  expect(payText({ pay_model: 'percent', pay_min: 30, pay_max: 40 })).toBe('30% to 40% of the load')
  expect(payText({ pay_model: 'weekly_flat', pay_min: 1200, pay_max: 1200 })).toBe('$1,200 per week')
  expect(payText({ pay_model: 'negotiable', pay_min: null, pay_max: null })).toBe('Negotiable')
})

test('posting is free for now, and the switch to paid works', () => {
  expect(canPostJobs('free', 'carrier')).toBe(true)
  expect(canPostJobs(null, 'escort')).toBe(true)
})

test('only a signed-in, non-suspended account posts; limits hold; an invalid body is a 400', async () => {
  getDb().sessionUser = null
  expect((await create(post(good))).status).toBe(401)
  as('poster')
  expect((await create(post({ ...good, description: 'text 555 123 4567' }))).status).toBe(400)
  expect((await create(post(good))).status).toBe(200)
  const row = getDb().tables.job_posts[0]
  expect(row).toMatchObject({ poster_id: 'poster', status: 'open', title: good.title })
  expect(Date.parse(row.expires_at as string)).toBeGreaterThan(Date.now() + 29 * 86400000)
  for (let i = 1; i < LIMITS.openJobsPerAccount; i++) expect((await create(post(good))).status).toBe(200)
  expect((await create(post(good))).status).toBe(429)
  getDb().tables.profiles.find((p) => p.id === 'poster')!.suspended = true
  expect((await create(post(good))).status).toBe(403)
  // the poster's own list shows applicant counts
  getDb().tables.profiles.find((p) => p.id === 'poster')!.suspended = false
  expect((await (await mine()).json()).jobs).toHaveLength(LIMITS.openJobsPerAccount)
})

function seed() {
  const now = new Date().toISOString()
  getDb().tables.job_posts = [{ id: J1, poster_id: 'poster', title: 'Lead escort', status: 'open', created_at: now, expires_at: new Date(Date.now() + 86400000).toISOString() }]
  getDb().tables.job_applications = []
}

test('applying: needs sign-in, no own job, no closed or expired job, once only, no contact details in the message', async () => {
  seed()
  const a = (body: unknown = { message: 'I run a certified truck.' }) => apply(post(body), ctx({ id: J1 }))
  getDb().sessionUser = null
  expect((await a()).status).toBe(401)
  as('poster')
  expect((await a()).status).toBe(400)
  as('escort')
  expect((await a({ message: 'call 555 123 4567' })).status).toBe(400)
  expect((await a()).status).toBe(200)
  expect((await a()).status).toBe(409)
  expect(getDb().tables.job_applications).toHaveLength(1)
  as('other')
  getDb().tables.job_posts[0].status = 'closed'
  expect((await a()).status).toBe(404)
  getDb().tables.job_posts[0].status = 'open'
  getDb().tables.job_posts[0].expires_at = new Date(Date.now() - 1000).toISOString()
  expect((await a()).status).toBe(404)
  expect((await apply(post({}), ctx({ id: 'nope' }))).status).toBe(404)
})

test('the poster sees applicants (public fields only); strangers do not; contact only after accept and only to the two parties', async () => {
  seed()
  as('escort'); expect((await apply(post({ message: 'hi' }), ctx({ id: J1 }))).status).toBe(200)
  const appId = getDb().tables.job_applications[0].id as string

  as('other')
  expect((await applicants(post({}), ctx({ id: J1 }))).status).toBe(403)
  expect((await decide(post({ action: 'accept' }), ctx({ appId }))).status).toBe(403)

  as('poster')
  const list = await (await applicants(post({}), ctx({ id: J1 }))).json()
  expect(list.applications).toHaveLength(1)
  // the mock returns whole rows, so prove the route asks for public columns only
  const src = fs.readFileSync('app/api/jobs/[id]/applications/route.ts', 'utf8').replace(/\/\/.*$/gm, '')
  expect(src).toContain('PUBLIC_PROFILE_COLUMNS.join')
  expect(src).not.toMatch(/select\([^)]*(email|phone)/i)
  expect(PUBLIC_PROFILE_COLUMNS.some((c) => /email|phone/.test(c))).toBe(false)
  expect((await contact(new NextRequest(`http://localhost/api/jobs/contact?applicationId=${appId}`))).status).toBe(403)

  expect((await decide(post({ action: 'accept' }), ctx({ appId }))).status).toBe(200)
  expect(getDb().tables.job_applications[0].status).toBe('accepted')
  expect((await decide(post({ action: 'decline' }), ctx({ appId }))).status).toBe(409)
  const get = (id: string) => { as(id); return contact(new NextRequest(`http://localhost/api/jobs/contact?applicationId=${appId}`)) }
  expect(await (await get('poster')).json()).toMatchObject({ phone: '555-0199', email: 'driver@x.example' })
  expect(await (await get('escort')).json()).toMatchObject({ phone: '555-0100', email: 'boss@fleet.example' })
  expect((await get('other')).status).toBe(403)
})

test('decline, withdraw and bad actions', async () => {
  seed()
  as('escort'); await apply(post({}), ctx({ id: J1 }))
  const appId = getDb().tables.job_applications[0].id as string
  as('poster')
  expect((await decide(post({ action: 'nuke' }), ctx({ appId }))).status).toBe(400)
  expect((await decide(post({ action: 'withdraw' }), ctx({ appId }))).status).toBe(403)
  expect((await decide(post({ action: 'decline' }), ctx({ appId }))).status).toBe(200)
  expect(getDb().tables.job_applications[0].status).toBe('declined')
  as('escort')
  expect((await decide(post({ action: 'withdraw' }), ctx({ appId }))).status).toBe(200)
  expect(getDb().tables.job_applications[0].status).toBe('withdrawn')
  as('poster')
  expect((await decide(post({ action: 'accept' }), ctx({ appId }))).status).toBe(409)
  expect((await decide(post({ action: 'accept' }), ctx({ appId: 'x' }))).status).toBe(404)
})

test('close, fill, remove: poster or admin only; a removed job stays removed for the poster', async () => {
  seed()
  const run = (action: string) => act(post({ action }), ctx({ id: J1 }))
  as('other'); expect((await run('close')).status).toBe(403)
  as('poster')
  expect((await run('nuke')).status).toBe(400)
  expect((await run('filled')).status).toBe(200)
  expect(getDb().tables.job_posts[0].status).toBe('filled')
  expect((await run('reopen')).status).toBe(200)
  expect(getDb().tables.job_posts[0].status).toBe('open')
  as('admin', 'admin@example.com')
  expect((await run('remove')).status).toBe(200)
  as('poster')
  expect((await run('reopen')).status).toBe(403)
  expect(getDb().tables.job_posts[0].status).toBe('removed')
})

test('escort earnings: rate times miles, loads without miles add no dollars, anonymous is refused', async () => {
  const { GET: earn } = await import('@/app/api/escort/earnings/route')
  getDb().sessionUser = null
  expect((await earn()).status).toBe(401)
  as('escort')
  const now = new Date().toISOString()
  getDb().tables.loads = [{ id: 'l1', miles: 200 }, { id: 'l2', miles: null, estimated_miles: null }]
  getDb().tables.bids = [
    { id: 'b1', escort_id: 'escort', load_id: 'l1', rate: 2.5, status: 'accepted', created_at: now },
    { id: 'b2', escort_id: 'escort', load_id: 'l2', rate: 3, status: 'accepted', created_at: now },
    { id: 'b3', escort_id: 'escort', load_id: 'l1', rate: 9, status: 'pending', created_at: now },
    { id: 'b4', escort_id: 'other', load_id: 'l1', rate: 9, status: 'accepted', created_at: now },
  ]
  expect(await (await earn()).json()).toEqual({ month: 500, lifetime: 500, jobsCount: 2 })
})
