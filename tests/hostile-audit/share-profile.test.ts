import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const src = fs.readFileSync(path.resolve(__dirname, '../../app/dashboard/_client.tsx'), 'utf8')

test('the share card uses the signed-in user id and no other url source', () => {
  const start = src.indexOf('function ShareProfileCard')
  const end = src.indexOf('export function DashboardPageClient')
  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)
  const card = src.slice(start, end)

  expect(card).toContain('Share your profile')
  expect(card).toContain('https://www.oversize-escort-hub.com/escorts/${userId}')
  expect(card).toContain('navigator.clipboard')
  expect(card).toContain('navigator.share')
  expect(card).toContain("QRCode.toString(url, { type: 'svg', margin: 1 })")
  expect(card).not.toContain('<input')
  expect(card).not.toContain('window.location')
  expect(card).not.toContain('searchParams')
  expect(card).not.toContain('prompt(')

  const built = [...card.matchAll(/https:\/\/www\.oversize-escort-hub\.com\/escorts\/\$\{([^}]+)\}/g)].map((m) => m[1])
  expect(built).toEqual(['userId'])

  expect(src).toContain('<ShareProfileCard userId={profile.id} />')
  expect(src).not.toMatch(/ShareProfileCard userId=\{(?!profile\.id)/)
})
