import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const root = path.resolve(__dirname, '../..')
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')

test('find-escorts reads escort_availability.location_state and filters sponsored_zones.zone', () => {
  const src = read('app/find-escorts/page.tsx')
  expect(src).toMatch(/from\("escort_availability"\)[\s\S]{0,80}\.select\("location_state"\)/)
  expect(src).not.toMatch(/from\("escort_availability"\)[\s\S]{0,80}\.select\("state"\)/)
  expect(src).toContain('.eq("zone", stateFilter)')
  expect(src).not.toContain('.eq("state", stateFilter)')
  expect(src).toContain('z.location_state')
  expect(src).not.toContain('z.state')
})

test('availability zones save and load location_state', () => {
  const src = read('app/available/page.tsx')
  expect(src).toContain('.select("location_state")')
  expect(src).not.toContain('.select("state")')
  expect(src).toContain('location_state: state')
  expect(src).not.toMatch(/\{\s*escort_id:\s*userId,\s*state\s*\}/)
  expect(src).toContain('r.location_state')
})

test('flat-rate sponsored escorts filter sponsored_zones.zone', () => {
  const src = read('app/flat-rate/_client.tsx')
  expect(src).toContain(".eq('zone', stateFilter)")
  expect(src).not.toContain(".eq('state', stateFilter)")
})

test('post-load sponsored escorts filter sponsored_zones.zone', () => {
  const src = read('app/post-load/_client.tsx')
  expect(src).toContain(".eq('zone', pickupState)")
  expect(src).not.toContain(".eq('state', pickupState)")
})

test('sms blast reads escort_availability.location_state', () => {
  const src = read('app/api/sms/route.ts')
  expect(src).toContain(".select('location_state')")
  expect(src).not.toContain(".select('state')")
  expect(src).toContain('z.location_state')
})

test('member push broadcast filters escort_availability.location_state', () => {
  const src = read('app/api/push/broadcast/route.ts')
  expect(src).toContain(".eq('location_state', puState)")
  expect(src).not.toContain(".eq('state', puState)")
})

test('filing a dispute writes disputes.filed_by, load_id, and description', () => {
  const src = read('app/page.tsx')
  const insertAt = src.indexOf("from('disputes').insert")
  expect(insertAt).toBeGreaterThan(0)
  const insert = src.slice(insertAt, insertAt + 280)
  expect(insert).toContain('filed_by:')
  expect(insert).toContain('load_id:')
  expect(insert).toContain('description:')
  expect(insert).not.toContain('escort_id:')
  expect(insert).not.toContain('job_id:')
  expect(insert).not.toContain('message:')
  expect(src).toContain(".eq('filed_by', user.id)")
  expect(src).not.toContain(".eq('escort_id', user.id)")
  expect(src).toContain('{d.description}')
})

test('escort profile shows availability location_state and review comment', () => {
  const src = read('app/escorts/[id]/page.tsx')
  expect(src).toContain('z.location_state')
  expect(src).not.toContain('z.state')
  expect(src).toContain('r.comment')
  expect(src).not.toContain('r.body')
})

test('reviews list renders the comment column', () => {
  const src = read('app/reviews/page.tsx')
  expect(src).toContain('r.comment')
  expect(src).not.toContain('r.body')
})

test('admin lists sponsored_zones.zone and disputes.load_id', () => {
  const src = read('app/admin/page.tsx')
  expect(src).toContain('z.zone')
  expect(src).not.toContain('z.state')
  expect(src).toContain('d.load_id')
  expect(src).not.toContain('d.job_id')
  expect(src).toContain('d.description')
})
