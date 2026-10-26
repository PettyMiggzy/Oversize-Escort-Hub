import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import sitemap from '@/app/sitemap'
import page from '@/app/pilot-car-escorts/[state]/page'

const root = path.resolve(__dirname, '../..')

const FIFTY = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga',
  'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md',
  'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
  'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
]

test('an unknown state code is a 404', async () => {
  expect(FIFTY).toHaveLength(50)
  for (const state of ['zz', 'ZZ', 'california', 't', 'pr']) {
    await expect(page({ params: Promise.resolve({ state }) })).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })
  }
  const known = await page({ params: Promise.resolve({ state: 'tx' }) })
  expect(known).toBeTruthy()
  const province = await page({ params: Promise.resolve({ state: 'on' }) })
  expect(province).toBeTruthy()
})

test('the state page module never selects email, phone, or stripe', () => {
  const src = fs.readFileSync(path.join(root, 'app/pilot-car-escorts/[state]/page.tsx'), 'utf8')
  expect(src.toLowerCase()).not.toMatch(/email|phone|stripe/)
  expect(src).toContain('PUBLIC_PROFILE_SELECT')
  expect(src).toContain(".contains('availability_states'")
  expect(src).toContain(".contains('states_licensed'")
  expect(src).toContain(".or('suspended.is.null,suspended.eq.false')")
  expect(src).toContain('.limit(60)')
})

test('the sitemap lists all 51 state urls', () => {
  const urls = sitemap().map((entry) => entry.url)
  const stateUrls = urls.filter((url) => url.includes('/pilot-car-escorts/'))
  expect(stateUrls).toHaveLength(51)
  for (const code of [...FIFTY, 'dc']) {
    expect(urls).toContain(`https://www.oversize-escort-hub.com/pilot-car-escorts/${code}`)
  }
})

test('find escorts links the 50 state pages', () => {
  const src = fs.readFileSync(path.join(root, 'app/find-escorts/page.tsx'), 'utf8')
  expect(src).toContain('Find escorts by state')
  expect(src).toContain('href={`/pilot-car-escorts/${st.toLowerCase()}`}')
  const list = src.slice(src.indexOf('const US_STATES'), src.indexOf(']', src.indexOf('const US_STATES'))).toLowerCase()
  for (const code of FIFTY) expect(list).toContain(`"${code}"`)
})
