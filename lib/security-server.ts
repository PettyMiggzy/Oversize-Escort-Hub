import { timingSafeEqual } from 'crypto'

// Constant-time string compare for secrets and signatures.
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
