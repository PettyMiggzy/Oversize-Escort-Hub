import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const root = path.resolve(__dirname, '../..')
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')

function strip(src: string) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

const NEW_BROWSER = [
  'app/jobs/page.tsx',
  'app/jobs/_client.tsx',
  'app/jobs/query.ts',
]

test('new jobs pages do not select email or phone', () => {
  for (const rel of NEW_BROWSER) {
    const src = strip(read(rel))
    expect(src, rel).not.toMatch(/\.select\(\s*[^)]*\b(email|phone)\b/i)
    expect(src, rel).not.toMatch(/\b(email|phone)\b/i)
  }
  expect(read('app/jobs/page.tsx')).toContain('export const revalidate = 300')
  expect(read('app/jobs/page.tsx')).toContain('Escort and pilot car jobs | Oversize Escort Hub')
})
