// What a pilot car still has to fill in so carriers can find them. Nothing here checks that the answers are true.
export type ProfileLike = {
  full_name?: string | null
  phone?: string | null
  state?: string | null
  availability_states?: string[] | null
  equipment?: string[] | null
}

export type Step = { key: string; label: string; href: string; done: boolean }

const has = (v: unknown) => typeof v === 'string' && v.trim() !== ''
const some = (v: unknown) => Array.isArray(v) && v.length > 0

export function profileSteps(p: ProfileLike): Step[] {
  return [
    { key: 'name', label: 'Your name', href: '/profile', done: has(p.full_name) },
    { key: 'phone', label: 'A phone number', href: '/profile', done: has(p.phone) },
    { key: 'state', label: 'Your home state', href: '/profile', done: has(p.state) },
    { key: 'zones', label: 'The states you work in', href: '/available', done: some(p.availability_states) },
    { key: 'rig', label: 'What is on your vehicle', href: '/profile', done: some(p.equipment) },
  ]
}

export function profileProgress(p: ProfileLike) {
  const steps = profileSteps(p)
  const done = steps.filter((s) => s.done).length
  return { steps, done, total: steps.length, pct: Math.round((done / steps.length) * 100), complete: done === steps.length }
}
