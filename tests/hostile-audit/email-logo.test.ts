import fs from 'node:fs'
import path from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { EMAIL_LOGO_URL, sendEmail, withLogo } from '@/lib/email'

const root = path.resolve(__dirname, '../..')

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

test('the email logo is a small file in public/ at the URL the emails use', () => {
  expect(EMAIL_LOGO_URL).toBe('https://www.oversize-escort-hub.com/email-logo.png')
  const file = path.join(root, 'public/email-logo.png')
  expect(fs.existsSync(file)).toBe(true)
  expect(fs.statSync(file).size).toBeLessThan(30_000)
})

test('every email gets the logo once, with alt text and a fixed size', () => {
  const out = withLogo('<p>Hello</p>')
  expect(out).toContain(`src="${EMAIL_LOGO_URL}"`)
  expect(out).toContain('alt="Oversize Escort Hub"')
  expect(out).toMatch(/width="180" height="67"/)
  expect(out.endsWith('<p>Hello</p>')).toBe(true)
  expect(withLogo(out)).toBe(out)
  // an email that already shows the old logo is left alone
  const own = '<img src="https://www.oversize-escort-hub.com/logo.png" alt="x">'
  expect(withLogo(own)).toBe(own)
})

test('sendEmail sends the body with the logo on top', async () => {
  vi.stubEnv('RESEND_API_KEY', 'ZZTEST-not-a-key')
  const calls: { html: string; to: string }[] = []
  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => { calls.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }) })
  expect(await sendEmail({ to: 'zztest@example.com', subject: 'ZZTEST', html: '<p>Body</p>' })).toBe(true)
  expect(calls).toHaveLength(1)
  expect(calls[0].html.startsWith('<div style="text-align:center')).toBe(true)
  expect(calls[0].html).toContain(EMAIL_LOGO_URL)
  expect(calls[0].html.endsWith('<p>Body</p>')).toBe(true)
})
