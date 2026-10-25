import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/profile-columns'
import { scanProfileReads, SENSITIVE_PROFILE_COLUMNS } from './contact-columns'

const root = path.resolve(__dirname, '../..')

test('browser code does not read a sensitive column of another profile', () => {
  const hits = scanProfileReads(root)
  expect(hits, JSON.stringify(hits, null, 2)).toEqual([])
})

test('the public column grant does not include a sensitive column', () => {
  const pub = new Set<string>(PUBLIC_PROFILE_COLUMNS)
  for (const col of SENSITIVE_PROFILE_COLUMNS) expect(pub.has(col)).toBe(false)
})

const sql = fs.readFileSync(path.join(root, 'docs/db-security-fixes-8.sql'), 'utf8')

test('the SQL moves the loads policy off profiles.email before it revokes anything', () => {
  const fn = sql.indexOf('function public.is_pro_viewer()')
  const policy = sql.search(/create policy "Pro users see all open loads"[\s\S]*is_pro_viewer\(\)/)
  const revoke = sql.indexOf('revoke select on table public.profiles from authenticated')
  expect(fn).toBeGreaterThan(-1)
  expect(policy).toBeGreaterThan(fn)
  expect(revoke).toBeGreaterThan(policy)
  expect(sql).toMatch(/security definer/i)
})

test('the SQL grant list is exactly the public column list', () => {
  const m = sql.match(/grant select \(([\s\S]*?)\) on public\.profiles to authenticated/)
  const granted = (m?.[1] ?? '').split(',').map((c) => c.trim()).filter(Boolean)
  expect(granted.sort()).toEqual([...PUBLIC_PROFILE_COLUMNS].sort())
})
