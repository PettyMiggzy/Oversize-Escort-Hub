import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

// Inside the phone app nothing is sold: every page or button that starts a Stripe payment must be hidden or refused there.
const root = path.resolve(__dirname, '../..')
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8')

test('whole-page checkout screens are wrapped so the app shows a plain note instead', () => {
  for (const f of ['app/checkout/page.tsx', 'app/join/page.tsx']) {
    const src = read(f)
    expect(src, f).toContain("from '@/components/WebOnly'")
    expect(src, f).toMatch(/<WebOnly>/)
  }
  const web = read('components/WebOnly.tsx')
  expect(web).toContain('isNativeApp')
  expect(web).not.toMatch(/\$\d/)
})

test('payment buttons on mixed pages stop inside the app', () => {
  // the old verification pages no longer sell anything: they send everyone to the "not live" page
  for (const f of ['app/verify/page.tsx', 'app/bgc/page.tsx', 'app/bgc-checkout/page.tsx', 'app/bgc-badge/page.tsx', 'app/verification/page.tsx']) expect(read(f), f).toContain("redirect('/coming-later')")
  const dash = read('app/dashboard/_client.tsx')
  expect(dash).toContain('isNativeApp')
  expect(dash).toMatch(/\{!inApp && \(\s*<section>/)
})

test('the board ad column is hidden inside the app', () => {
  const side = read('components/BoardAdSidebar.tsx')
  expect(side).toContain('isNativeApp')
  expect(side).toMatch(/if \(native\) return null/)
})

test('the sponsored-zone price card on /pricing is hidden inside the app', () => {
  expect(read("app/pricing/page.tsx")).toMatch(/\{!inApp && \(<Card>\s*<div id="sponsored" \/>/)
})

test('paid sponsored escort strips are hidden inside the app', () => {
  expect(read('app/flat-rate/_client.tsx')).toMatch(/!inApp && stateFilter && sponsoredEscorts\.length > 0/)
  expect(read('app/find-escorts/page.tsx')).toMatch(/!inApp && sponsored\.length > 0/)
})

test('the signed-in home page makes no unverifiable market claims', () => {
  const home = read('app/page.tsx')
  for (const claim of ['$800+', '50,000+', '$670M', 'FastPay Fill Speed']) expect(home).not.toContain(claim)
})

test('upgrade prices and pay buttons on the home page are hidden inside the app', () => {
  const home = read('app/page.tsx')
  for (const label of ['Upgrade to Member \u2014 $19.99/mo', 'Go Pro \u2014 $29.99/mo', 'Upgrade to Pro \u2014 $29.99/mo']) {
    const i = home.indexOf(label)
    expect(i, label).toBeGreaterThan(-1)
    expect(home.slice(Math.max(0, i - 260), i), label).toContain('<HideInApp>')
  }
})
