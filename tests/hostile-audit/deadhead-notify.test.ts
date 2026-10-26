import { beforeEach, expect, test, vi } from 'vitest'
import { getDb, resetHostile } from './mock-client'

const sent: { to: string; subject: string }[] = []
vi.mock('@/lib/email', () => ({ sendEmail: async (m: { to: string; subject: string }) => { sent.push({ to: m.to, subject: m.subject }); return true } }))
import { notifyDeadhead } from '@/lib/deadhead'

beforeEach(() => {
  resetHostile(); sent.length = 0
  // every city is "near" every other: the geocoder always answers the same spot
  vi.stubGlobal('fetch', async () => ({ json: async () => [{ lat: '32.78', lon: '-96.80' }] }))
  getDb().tables.loads = [
    { id: 'new', status: 'open', pu_city: 'Dallas', pu_state: 'TX', dl_city: 'Tulsa', dl_state: 'OK', escort_type: 'Lead', per_mile_rate: 2.5, board_type: 'flat-rate', deadhead_notified_at: null },
    { id: 'busy', status: 'filled', matched_escort_id: 'e1', deadhead_destination_city: 'Fort Worth', deadhead_destination_state: 'TX' },
    { id: 'busy2', status: 'filled', matched_escort_id: 'e2', deadhead_destination_city: 'Fort Worth', deadhead_destination_state: 'TX' },
  ]
  getDb().tables.profiles = [
    { id: 'e1', tier: 'free', email: 'one@x.example', phone: null, email_alerts: true },
    { id: 'e2', tier: 'free', email: 'two@x.example', phone: null, email_alerts: false },
  ]
})

test('a matched escort finishing near a new load gets the heads-up in the app and by email, unless alerts are off', async () => {
  const r = await notifyDeadhead('new')
  expect(r).toMatchObject({ notified: 2 })
  expect(getDb().tables.notifications.map((n) => n.user_id).sort()).toEqual(['e1', 'e2'])
  expect(sent).toEqual([{ to: 'one@x.example', subject: expect.stringContaining('Deadhead opportunity') }])
})

test('a suspended escort is not emailed', async () => {
  getDb().tables.profiles[0].suspended = true
  await notifyDeadhead('new')
  expect(sent).toEqual([])
})
