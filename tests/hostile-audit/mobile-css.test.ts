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
  expect(css).toMatch(/html\.native-app body\{padding-top:env\(safe-area-inset-top/)
  expect(fs.readFileSync('app/layout.tsx', 'utf8')).toContain("viewportFit: 'cover'")
  expect(fs.readFileSync('app/layout.tsx', 'utf8')).toContain('<NativeFlag />')
  expect(fs.readFileSync('components/SiteHeader.tsx', 'utf8')).toContain('var(--safe-top, 0px)')
})

test('the menu (hamburger) button really shows on phones: the later default rule must not hide it', () => {
  const page = fs.readFileSync('app/page.tsx', 'utf8')
  expect(page).toMatch(/\.ham-btn\{display:flex!important;/)
})
