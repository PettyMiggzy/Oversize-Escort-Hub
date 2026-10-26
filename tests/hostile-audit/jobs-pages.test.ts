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
  'app/jobs/[id]/page.tsx',
  'app/jobs/[id]/apply-box.tsx',
  'app/post-job/page.tsx',
  'app/post-job/_client.tsx',
  'app/dashboard/_client.tsx',
]

test('new jobs pages do not select email or phone', () => {
  for (const rel of NEW_BROWSER) {
    const src = strip(read(rel))
    expect(src, rel).not.toMatch(/\.select\(\s*[^)]*\b(email|phone)\b/i)
  }
  expect(strip(read('app/jobs/query.ts'))).not.toMatch(/\b(email|phone)\b/i)
  expect(read('app/jobs/page.tsx')).toContain('export const revalidate = 300')
  expect(read('app/jobs/page.tsx')).toContain('Escort and pilot car jobs | Oversize Escort Hub')
})

test('the job page carries JobPosting JSON-LD', () => {
  const src = read('app/jobs/[id]/page.tsx')
  expect(src).toContain('application/ld+json')
  expect(src).toContain('JobPosting')
  expect(src).toContain('validThrough')
  expect(src).toContain("return 'CONTRACTOR'")
  expect(src).toContain("job.pay_model !== 'negotiable' && job.pay_model !== 'percent'")
  expect(src).toContain('baseSalary')
})

test('the terms include a plain jobs board section', () => {
  const src = read('app/terms/page.tsx')
  expect(src).toContain('Jobs board')
  expect(src).toContain('marketplace, not the employer')
  expect(src).toContain('Do not put contact details in posts or applications')
  expect(src).toContain('may remove posts')
})

test('/jobs is in the sitemap code', () => {
  const src = read('app/sitemap.ts')
  expect(src).toContain('/jobs')
  expect(src).toContain("from('job_posts')")
  expect(src).toContain('createClient')
})

test('the apply box posts to the apply route', () => {
  const src = read('app/jobs/[id]/apply-box.tsx')
  expect(src).toMatch(/\/api\/jobs\/\$\{[^}]+\}\/apply/)
  expect(src).toContain('href="/signin"')
  expect(src).toContain('This is your job')
})
