import fs from 'node:fs'
import { expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

const req = (host: string, path: string) => new NextRequest(`http://${host}${path}`, { headers: { host } })

test('the company domain shows the company page at / and sends every other path back', async () => {
  const home = await middleware(req('precisionpilotservices.com', '/'))
  expect(home.headers.get('x-middleware-rewrite')).toContain('/company')
  const other = await middleware(req('www.precisionpilotservices.com', '/open-loads?x=1'))
  expect(other.status).toBe(307)
  expect(other.headers.get('location')).toBe('http://www.precisionpilotservices.com/')
})

test('the main site is untouched by the company-domain rule', async () => {
  const res = await middleware(req('www.oversize-escort-hub.com', '/pricing'))
  expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  expect(res.status).toBe(200)
})

test('the company page names the LLC and the DBA, links to OEH, and claims no checks, licenses or numbers', () => {
  const src = fs.readFileSync('app/company/page.tsx', 'utf8')
  expect(src).toContain('Precision Pilot Services, LLC')
  expect(src).toContain('doing business as Oversize Escort Hub')
  expect(src).toContain('does not check or verify')
  expect(src).not.toMatch(/USDOT|licensed|insured|verified badge|guarantee|best|cheapest/i)
})

test('the company page shows the owner-approved phone number as a tap-to-call link', () => {
  const src = fs.readFileSync('app/company/page.tsx', 'utf8')
  expect(src).toContain('tel:+13176252831')
  expect(src).toContain('(317) 625-2831')
})
