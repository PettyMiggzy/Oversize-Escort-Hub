import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const root = path.resolve(__dirname, '../..')
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8')

test('the top bar is three menus plus Post a Load and visitors who are not signed in post through the no-account form', () => {
  const header = read('components/SiteHeader.tsx')
  const groups = header.slice(header.indexOf('const GROUPS'), header.indexOf('const POST'))
  for (const label of ['Find Loads', 'Pilot Cars', 'Tools', 'Flat rate board', 'Open bid board', '5-minute bid board', 'Find pilot cars', 'Invoice maker', 'Expense tracker', 'Permit directory']) expect(groups).toContain(label)
  expect((groups.match(/^  \{\n    label:/gm) ?? []).length).toBe(3)
  expect(header).toContain('label: "Post a Load"')
  expect(header).toContain('label: "How it works"')
  expect(header).toMatch(/!userProfile \? "\/quick-post"/)
  expect(read('components/HomeLanding.tsx')).toContain('href="/quick-post"')
})

test('the three boards share tabs and drop the ad column when empty', () => {
  for (const [file, key, empty] of [
    ['app/flat-rate/_client.tsx', 'flat', 'filteredLoads.length'],
    ['app/open-loads/_client.tsx', 'open', 'loads.length'],
    ['app/bid-board/_client.tsx', 'bid', 'loads.length'],
  ]) {
    const src = read(file)
    expect(src, file).toContain(`<BoardTabs active="${key}" />`)
    expect(src, file).toContain(`${empty} > 0 && <BoardAdSidebar />`)
  }
})

test('sign-up can take a phone number and the server (not the browser) saves it once', () => {
  expect(read('app/signin/page.tsx')).toMatch(/phone: phone\.trim\(\)\.slice\(0, 30\)/)
  const cb = read('app/auth/callback/route.ts')
  expect(cb).toContain("serviceClient().from('profiles').update({ phone: metaPhone })")
  expect(cb).toContain(".is('phone', null)")
})

test('forgot password and the reset page exist, and the weekly digest is scheduled', () => {
  expect(read('app/signin/page.tsx')).toContain('resetPasswordForEmail')
  expect(read('app/reset-password/page.tsx')).toContain('updateUser({ password: pw })')
  const cron = JSON.parse(read('vercel.json')).crons.map((c: { path: string }) => c.path)
  expect(cron).toContain('/api/cron/weekly-digest')
  expect(cron).toContain('/api/cron/expire-loads')
})
