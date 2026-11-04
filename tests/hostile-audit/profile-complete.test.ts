import { expect, test } from 'vitest'
import { readFileSync } from 'fs'
import { profileProgress } from '@/lib/profile-complete'

test('an empty pilot car profile is 0 of 5, a full one is complete', () => {
  const empty = profileProgress({})
  expect(empty.done).toBe(0)
  expect(empty.total).toBe(5)
  expect(empty.complete).toBe(false)
  const full = profileProgress({ full_name: 'A B', phone: '5551234567', state: 'TX', availability_states: ['TX'], equipment: ['light_bar'] })
  expect(full.complete).toBe(true)
  expect(full.pct).toBe(100)
})

test('blank text and empty lists do not count as done, and the next step points somewhere real', () => {
  const p = profileProgress({ full_name: '  ', phone: '', state: null, availability_states: [], equipment: null })
  expect(p.done).toBe(0)
  const partial = profileProgress({ full_name: 'A B', phone: '5551234567', state: 'TX', availability_states: [], equipment: [] })
  expect(partial.done).toBe(3)
  expect(partial.steps.find((s) => !s.done)!.href).toBe('/available')
})

test('the dashboard shows the nudge to pilot cars only and the card says we do not check entries', () => {
  expect(readFileSync('app/dashboard/_client.tsx', 'utf8')).toContain('{isEscort && <ProfileNudge')
  expect(readFileSync('components/ProfileNudge.tsx', 'utf8')).toContain('We do not check what you enter')
})
