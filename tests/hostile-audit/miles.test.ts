import { expect, test } from 'vitest'
import { readFileSync } from 'fs'
import { estimatedTotal, roadMiles, straightMiles } from '@/lib/miles'

test('Dallas to Oklahoma City: straight-line is about 180 miles, the road estimate is about 20 percent more', () => {
  const dal = { lat: 32.7767, lon: -96.797 }, okc = { lat: 35.4676, lon: -97.5164 }
  const s = straightMiles(dal.lat, dal.lon, okc.lat, okc.lon)
  expect(s).toBeGreaterThan(170)
  expect(s).toBeLessThan(195)
  const r = roadMiles(dal, okc)
  expect(r).toBeGreaterThan(205)
  expect(r).toBeLessThan(235)
})

test('the total is the rate times the miles, and missing or zero numbers give nothing', () => {
  expect(estimatedTotal(1.9, 250)).toBe(475)
  expect(estimatedTotal('2.00', '217')).toBe(434)
  expect(estimatedTotal(null, 250)).toBeNull()
  expect(estimatedTotal(1.9, 0)).toBeNull()
  expect(estimatedTotal(undefined, undefined)).toBeNull()
  expect(estimatedTotal(-2, 100)).toBeNull()
})

test('a new load gets its mileage estimated after posting, and the board labels it an estimate', () => {
  expect(readFileSync('app/api/loads/route.ts', 'utf8')).toContain('estimateLoadMiles')
  const board = readFileSync('app/flat-rate/_client.tsx', 'utf8')
  expect(board).toContain('estimatedTotal(load.per_mile_rate')
  expect(board).toContain('(estimate)')
})
