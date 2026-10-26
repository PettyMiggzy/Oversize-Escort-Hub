import fs from 'node:fs'
import { expect, test } from 'vitest'
import { GUIDE_CHECKED, GUIDE_FAQ, GUIDE_SECTIONS, SOURCES } from '@/lib/guide-content'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { GET as llms } from '@/app/llms.txt/route'

test('every claim section names real sources, and every source is an https link to a public publisher', () => {
  for (const s of GUIDE_SECTIONS) {
    for (const id of s.sources) expect(SOURCES[id], `${s.id} -> ${id}`).toBeTruthy()
    // sections that state rules or numbers must cite something; only our own site description may cite nothing
    if (s.id !== 'finding-work') expect(s.sources.length, s.id).toBeGreaterThan(0)
  }
  for (const src of Object.values(SOURCES)) expect(src.url).toMatch(/^https:\/\/(ops\.fhwa\.dot\.gov|www\.esc\.org)\//)
  expect(GUIDE_CHECKED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

test('the guide never states a rule it cannot back up: no invented dollar amounts, no "always required", dated claims say so', () => {
  const text = GUIDE_SECTIONS.map((s) => [...s.body, ...(s.bullets ?? [])].join(' ')).join(' ') + GUIDE_FAQ.map((f) => f.a).join(' ')
  expect(text).not.toMatch(/\$\d/)
  expect(text).not.toMatch(/all states require|every state requires|guarantee/i)
  expect(text).toMatch(/early 2016/)
  expect(text).toMatch(/check|confirm/i)
  for (const f of GUIDE_FAQ) expect(f.a.length).toBeGreaterThan(30)
})

test('the page is in the sitemap and llms.txt, and robots.txt lets AI assistants read it', async () => {
  expect(sitemap().some((e) => e.url.endsWith('/pilot-car-guide'))).toBe(true)
  const txt = await llms().text()
  expect(txt).toContain('/pilot-car-guide')
  const r = robots()
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules]
  for (const bot of ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'anthropic-ai']) {
    const specific = rules.filter((x) => [x.userAgent].flat().includes(bot))
    expect(specific.every((x) => !([x.disallow].flat().includes('/'))), bot).toBe(true)
  }
  expect(rules.find((x) => x.userAgent === '*')?.disallow).toContain('/api/')
  expect(fs.readFileSync('app/pilot-car-guide/page.tsx', 'utf8')).toContain('application/ld+json')
})
