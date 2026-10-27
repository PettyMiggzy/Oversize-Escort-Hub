import fs from 'node:fs'
import { expect, test } from 'vitest'

test('accepting a bid writes the match with the service key, because users cannot write matched_escort_id', () => {
  const src = fs.readFileSync('app/api/bids/accept/route.ts', 'utf8')
  expect(src).not.toMatch(/supabase\s*\.from\('loads'\)\s*\.update/)
  expect(src).not.toMatch(/await supabase\s*\n\s*\.from\('loads'\)\s*\n\s*\.update/)
  expect(src).toMatch(/await svc\s*\n\s*\.from\('loads'\)/)
})

test('the lock SQL protects who a load is matched to and keeps sponsored zones service-only', () => {
  const sql = fs.readFileSync('docs/sql-lock-loads-zones.sql', 'utf8')
  for (const col of ['matched_escort_id', 'filled_by', 'reviewed_at', 'taken_flagged_at', 'source']) expect(sql).toContain(`new.${col} := old.${col}`)
  expect(sql).toContain('drop policy if exists "Auth users can insert sponsored zones"')
  expect(sql).toContain('revoke insert, update, delete on public.sponsored_zones')
  expect(sql).toContain('protect_profile_email')
})
