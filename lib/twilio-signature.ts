import { createHmac } from 'crypto'
import { safeEqual } from '@/lib/security-server'

function headerFirst(value: string | null): string {
  if (!value) return ''
  return value.split(',')[0]?.trim() ?? ''
}

// Twilio signs HMAC-SHA1(auth token, full URL + each POST param name and value, keys sorted), base64.
// No token or no header is a refusal. Callers try every candidate URL; one match is enough.
export function twilioSignatureValid(
  authToken: string | undefined,
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!authToken || !signature || !url) return false
  const signed = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url)
  let expected: string
  try {
    expected = createHmac('sha1', authToken).update(signed, 'utf8').digest('base64')
  } catch {
    return false
  }
  return safeEqual(expected, signature.trim())
}

// The public site URL and the forwarded host are both tried. A proxy and the canonical host sign different URLs.
export function twilioCandidateUrls(input: {
  siteUrl: string | undefined
  forwardedProto: string | null
  forwardedHost: string | null
  host: string | null
  pathname: string
  search: string
}): string[] {
  const path = `${input.pathname}${input.search}`
  const urls: string[] = []
  const site = (input.siteUrl ?? '').trim().replace(/\/+$/, '')
  if (site) urls.push(`${site}${path}`)
  const host = headerFirst(input.forwardedHost) || headerFirst(input.host)
  if (host) {
    let proto = headerFirst(input.forwardedProto) || 'https'
    proto = proto.replace(/:\/\//, '').replace(/:$/, '')
    urls.push(`${proto}://${host}${path}`)
  }
  return [...new Set(urls)]
}
