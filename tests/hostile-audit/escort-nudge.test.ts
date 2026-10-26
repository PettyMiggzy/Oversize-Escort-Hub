import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const read = (f: string) => fs.readFileSync(path.resolve(__dirname, '../..', f), 'utf8')

test('escorts with no states set see a prompt that links to the states page', () => {
  const src = read('app/dashboard/_client.tsx')
  expect(src).toContain('Add the states you cover')
  expect(src).toMatch(/!Array\.isArray\(profile\.availability_states\) \|\| profile\.availability_states\.length === 0/)
  expect(src).toContain('href="/available"')
})

test('a state page with no escorts is kept out of search results', () => {
  const src = read('app/pilot-car-escorts/[state]/page.tsx')
  expect(src).toMatch(/robots: rows\.length === 0 \? \{ index: false, follow: true \} : undefined/)
})
