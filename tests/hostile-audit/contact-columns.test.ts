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
