import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const root = path.resolve(__dirname, '../..')
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8')

test('the Wraith updates page is public, honest and keeps prices out of the phone apps', () => {
  const src = read('app/wraith/updates/page.tsx')
  // never claims anyone or anything is checked
  expect(src).not.toMatch(/\bverified\b|\bvetted\b|background[- ]check(ed)?/i)
  expect(src).toMatch(/does not check or verify/)
  // the price sits inside HideInApp
  const price = src.indexOf('$9.99')
  expect(price).toBeGreaterThan(0)
  expect(src.lastIndexOf('<HideInApp>', price)).toBeGreaterThan(0)
  expect(src.indexOf('</HideInApp>', price)).toBeGreaterThan(price)
  expect(src.slice(0, src.indexOf('<HideInApp>'))).not.toMatch(/\$\d/)
  // the open button only shows while Wraith is switched on, and there is no sign-in gate on the page itself
  expect(src).toMatch(/wraithLive\(\)/)
  expect(src).not.toMatch(/redirect\(|notFound\(/)
  // says what is live, what is next, and has a dated log
  expect(src).toMatch(/Live now/)
  expect(src).toMatch(/Coming next/)
  expect(src).toMatch(/Update log/)
  expect(src).toMatch(/Plans, not promises/)
  // the real files it points at exist
  expect(fs.existsSync(path.join(root, 'public/wraith-preview.jpg'))).toBe(true)
})

test('the page is in the sitemap and /coming-later lists Wraith in the apps', () => {
  expect(read('app/sitemap.ts')).toContain('/wraith/updates')
  expect(read('app/coming-later/page.tsx')).toMatch(/Wraith in the phone apps/)
})
