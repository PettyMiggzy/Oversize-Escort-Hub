import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

// Inside the phone app nothing is sold: every page or button that starts a Stripe payment must be hidden or refused there.
const root = path.resolve(__dirname, '../..')
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8')

test('whole-page checkout screens are wrapped so the app shows a plain note instead', () => {
  for (const f of ['app/checkout/page.tsx', 'app/bgc-checkout/page.tsx', 'app/join/page.tsx']) {
    const src = read(f)
    expect(src, f).toContain("from '@/components/WebOnly'")
    expect(src, f).toMatch(/<WebOnly>/)
  }
  const web = read('components/WebOnly.tsx')
  expect(web).toContain('isNativeApp')
  expect(web).not.toMatch(/\$\d/)
})

test('payment buttons on mixed pages stop inside the app', () => {
  const verify = read('app/verify/page.tsx')
  expect(verify).toMatch(/startBgcCheckout = async \(\) => \{\s*if \(isNativeApp\(\)\)/)
  expect(verify).toMatch(/startPevoCheckout = async \(tier: 'member'\|'pro'\) => \{\s*if \(isNativeApp\(\)\)/)
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
  expect(read('app/pricing/page.tsx')).toMatch(/\{!isNativeApp\(\) && \(<Card>\s*<div id="sponsored" \/>/)
})
