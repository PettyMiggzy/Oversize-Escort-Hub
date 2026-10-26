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
