import { expect, test } from 'vitest'
import { readFileSync } from 'fs'

const read = (p: string) => readFileSync(p, 'utf8')

test('the invoice PDF carries the pilot car, never the owner contact', () => {
  const s = read('app/api/invoices/generate/route.ts')
  expect(s).not.toContain('brian@precisionpilotservices.com')
  expect(s).not.toContain('Check, ACH, Zelle')
})

test('invoice and expense tiles are live, not coming soon', () => {
  const s = read('app/page.tsx')
  expect(s).toMatch(/label: "Invoice Maker", href: "\/tools\/invoice" }/)
  expect(s).toMatch(/label: "Expense Tracker", href: "\/tools\/expenses" }/)
})

test('expense CSV neutralises spreadsheet formulas and the tools say they are not tax or payment advice', () => {
  const e = read('app/tools/expenses/page.tsx')
  expect(e).toContain("/^[=+\\-@\\t\\r]/")
  expect(e).toContain('not tax advice')
  const i = read('app/tools/invoice/page.tsx')
  expect(i).toContain('does not send it, collect payment, or check the amounts')
})

test('the tools hub exists and the signed-in menu and dashboard link to the tools', () => {
  expect(read('app/tools/page.tsx')).toContain('/tools/invoice')
  expect(read('components/SiteHeader.tsx')).toContain('href="/tools"')
  expect(read('app/dashboard/_client.tsx')).toContain('/tools/invoice')
})
