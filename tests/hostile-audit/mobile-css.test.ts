import fs from 'node:fs'
import { expect, test } from 'vitest'

test('the phone-width input rule leaves checkboxes and radios alone, so the position chips do not stretch', () => {
  const css = fs.readFileSync('app/globals.css', 'utf8')
  const rule = css.match(/\/\* Post-a-load: inputs full width[^*]*\*\/\s*([^{]+)\{/)
  expect(rule).toBeTruthy()
  expect(rule![1]).toContain(':not([type="checkbox"])')
  expect(rule![1]).toContain(':not([type="radio"])')
  expect(css).toMatch(/\.ui-chip input\[type=checkbox\]/)
})

test('on phones the top bar hides the crowded items and keeps the menu button on screen', () => {
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  expect(page).toContain('<span className="nav-user-name">')
  expect(page).toMatch(/\.nav-user-name,\.nav-user \.nav-signout,\.nav-user select\{display:none!important\}/)
  expect(page).toMatch(/\.nav-name\{font-size:16px;white-space:nowrap\}/)
})

test('the phone apps leave room for the status bar', () => {
  const css = fs.readFileSync('app/globals.css', 'utf8')
  expect(css).toMatch(/html\.native-app body::before\{content:'';display:block;height:env\(safe-area-inset-top/)
  expect(css).toMatch(/html\.native-app::after\{content:'';position:fixed/)
  expect(fs.readFileSync('app/layout.tsx', 'utf8')).toContain("viewportFit: 'cover'")
  expect(fs.readFileSync('app/layout.tsx', 'utf8')).toContain('<NativeFlag />')
  expect(fs.readFileSync('components/SiteHeader.tsx', 'utf8')).toContain('var(--safe-top, 0px)')
})

test('the menu (hamburger) button really shows on phones: the later default rule must not hide it', () => {
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  expect(page).toMatch(/\.ham-btn\{display:flex!important;flex-direction:column;/)
})

test('the Deadhead Minimizer tool opens its dashboard tab and never links to a page that does not exist', () => {
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  expect(page).toContain('label: "Deadhead Minimizer", href: "#deadhead", tab: "dh"')
  expect(page).not.toContain('href: "/deadhead"')
  expect(fs.existsSync('app/deadhead')).toBe(false)
})

test('signed-in people can always sign out and reach account deletion from the shared header', () => {
  const h = fs.readFileSync('components/SiteHeader.tsx', 'utf8')
  expect(h).toContain('supabase.auth.signOut()')
  expect((h.match(/>Sign out</g) || []).length).toBeGreaterThanOrEqual(2)
  expect(h).toContain('href="/delete-account"')
})

test('the dashboard gives feedback instead of silently failing (subscription, expenses) and the footer has no link without a destination', () => {
  const d = fs.readFileSync('app/dashboard/_client.tsx', 'utf8')
  expect(d).toContain('There is no paid subscription to manage on this account.')
  expect(d).toContain('Everything is free while we launch. There is nothing to manage yet.')
  expect(d).toContain("setExpMsg('Enter an amount first.')")
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  expect(page).toContain('<a href="/signin?mode=signup">Create Account</a>')
  expect(page).not.toContain('["dashboard-c", "Carrier Dashboard"]')
})

test('Tailwind utilities are switched on (several pages use its class names) without the page-wide reset', () => {
  const css = fs.readFileSync('app/globals.css', 'utf8')
  expect(css).toContain('@tailwind utilities;')
  expect(css).not.toContain('@tailwind base')
})

test('pages that used to be bare (no header) now carry the site header, and Conduct is a real page', () => {
  for (const f of ['weather', 'fmcsa', 'invoices', 'loads', 'job-log']) {
    expect(fs.readFileSync(`app/${f}/page.tsx`, 'utf8'), f).toContain('<SiteHeader />')
  }
  const c = fs.readFileSync('app/conduct/page.tsx', 'utf8')
  expect(c).not.toContain('Paste Conduct here')
  expect(c).toContain('We do not check anyone')
  expect(c).toContain('Reporting a problem')
})

test('no paid-plan price or "member access required" text on the home screen while everything is free; no raw enum labels; footer fits signed-in people', () => {
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  expect(page).toMatch(/function LockBar[^]*?if \(FREE_LAUNCH\) return null;/)
  expect(page).toContain('signedIn={!!user}')
  expect(page).toContain('{!signedIn && <a href="/signin?mode=signup">Create Account</a>}')
  expect(page).not.toMatch(/profile\??\.tier\??\.toUpperCase\(\)/)
})

test('phone app: no pricing link, no coming-soon tiles, no SMS-coming-soon text on the legacy home', () => {
  const src = fs.readFileSync('app/page.tsx', 'utf8')
  expect(src).toContain('inApp && p === "pricing"')
  expect(src).toContain('inApp && tool.soon')
  expect(src).toContain('inApp ? allTools.filter')
  expect(src).not.toMatch(/SMS[^"\n]{0,60}coming soon|coming soon[^"\n]{0,40}SMS/i)
})

test('phone app: pricing page leaves for the dashboard, features page hides prices, home has no Pro prompt', () => {
  const pricing = fs.readFileSync('app/pricing/page.tsx', 'utf8')
  expect(pricing).toContain("window.location.replace('/dashboard')")
  expect(pricing).not.toMatch(/\{\s*isNativeApp\(\)\s*&&/)
  const features = fs.readFileSync('app/features/page.tsx', 'utf8')
  expect(features).toContain('inApp ? features.filter')
  expect(features).not.toMatch(/tier: '(Free\/Pro|Member\+|Fleet Pro|Coming Soon Pro)'/)
  const home = fs.readFileSync('app/page.tsx', 'utf8')
  expect(home).toMatch(/<HideInApp><div style=\{\{ padding: "12px 16px"/)
  expect(home).not.toMatch(/Not now, not at scale, not ever|pays for Pro 10/)
})

test('the legacy home menu panel is shown when it is rendered (it is only rendered while open)', () => {
  const src = fs.readFileSync('app/page.tsx', 'utf8')
  expect(src).toMatch(/\.mobile-drawer\{display:block;/)
  expect(src).toContain("createPortal(")
  expect(src).not.toMatch(/\.mobile-drawer\{display:none/)
})

test('the Google Play link is in both footers, hidden inside the app, and the footer has no forever promise', () => {
  const play = 'https://play.google.com/store/apps/details?id=pevo.oversizeescorthub.app'
  const footer = fs.readFileSync('components/SiteFooter.tsx', 'utf8')
  expect(footer).toContain(play)
  expect(footer).toMatch(/<HideInApp><a[^>]*play\.google\.com/)
  const home = fs.readFileSync('app/page.tsx', 'utf8')
  expect(home).toMatch(/<HideInApp><a href="https:\/\/play\.google\.com/)
  expect(home).not.toContain('NO JOB FEES · EVER')
})
