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
  expect(src).toMatch(/<WraithCta live=\{live\} \/>/)
  expect(src).not.toMatch(/redirect\(|notFound\(/)
  // signed-out visitors are offered a free account, signed-in people the way into Wraith
  const cta = read('components/WraithCta.tsx')
  expect(cta).toContain('Create a free account')
  expect(cta).toContain('href="/signin?mode=signup"')
  expect(cta).toMatch(/signedIn[\s\S]*Open Wraith/)
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

test('Wraith has a way in: the header menu and the dashboard show it only while it is on, never inside the phone apps', () => {
  expect(read('lib/wraith-flag.ts')).toMatch(/WRAITH_LIVE === 'on'/)
  expect(read('lib/wraith.ts')).toMatch(/export \{ wraithLive \} from '@\/lib\/wraith-flag'/)
  expect(read('app/layout.tsx')).toMatch(/data-wraith=\{wraithLive\(\) \? 'on' : undefined\}/)
  const header = read('components/SiteHeader.tsx')
  expect(header).toMatch(/setWraithOn\(document\.body\.dataset\.wraith === 'on' && !isNativeApp\(\)\)/)
  expect((header.match(/wraithOn && \(/g) || []).length).toBe(2)
  const dash = read('app/dashboard/_client.tsx')
  expect(dash).toMatch(/wraithOn && !inApp && \(/)
  expect(dash).toContain('href="/wraith/updates"')
  // the dashboard card carries no price
  const card = dash.slice(dash.indexOf('Wraith, your voice assistant'), dash.indexOf('Wraith, your voice assistant') + 900)
  expect(card).not.toMatch(/\$\d/)
})
