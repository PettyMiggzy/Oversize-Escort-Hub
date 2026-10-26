import { FREE_LAUNCH } from '@/lib/free-launch'

// Documents an escort can show on the public profile (certificate, insurance, vehicle). The files stay in private buckets;
// a visitor gets a link that works for five minutes, and only for a document that is approved, switched on by the escort and not expired.

export const DOC_LABELS: Record<string, string> = {
  pevo: 'P/EVO certificate', p_evo: 'P/EVO certificate', pilot_car: 'Pilot car certificate', escort_vehicle: 'Escort vehicle',
  oversize_permit: 'Oversize permit runner', state_cert: 'State certification', insurance: 'Proof of insurance', vehicle: 'Vehicle',
}
export const docLabel = (type: unknown) => DOC_LABELS[String(type || '').toLowerCase()] || String(type || 'Document').replace(/_/g, ' ')

// What an upload may be: a PDF or a photo, checked by its first bytes, not by what the browser says it is
export function sniffDocType(bytes: Uint8Array): 'pdf' | 'jpeg' | 'png' | 'webp' | null {
  const s = (i: number, str: string) => str.split('').every((c, k) => bytes[i + k] === c.charCodeAt(0))
  if (bytes.length >= 4 && s(0, '%PDF')) return 'pdf'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && s(1, 'PNG')) return 'png'
  if (bytes.length >= 12 && s(0, 'RIFF') && s(8, 'WEBP')) return 'webp'
  return null
}
export const DOC_MIME = { pdf: 'application/pdf', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const
export const DOC_EXT = { pdf: 'pdf', jpeg: 'jpg', png: 'png', webp: 'webp' } as const

// What a visitor is told next to every document. We do not check them, and the page says so.
export const DOC_DISCLAIMER = 'Uploaded by the escort. Oversize Escort Hub does not check these documents and does not guarantee they are real, current or enough for any job. Confirm certificates and insurance with the issuer before you hire.'

export const DOC_LIMITS = { maxBytes: 10 * 1024 * 1024, maxPending: 5, maxTotal: 15, linkSeconds: 300 }
export const DOC_BUCKETS = ['documents', 'pevo-certs', 'vehicle-docs']

/** "https://x.supabase.co/storage/v1/object/sign/documents/certs/a.pdf?token=..." -> { bucket, path } for our own buckets only. */
export function parseStorageUrl(url: unknown): { bucket: string; path: string } | null {
  if (typeof url !== 'string') return null
  const m = url.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/?#]+)\/([^?#]+)/)
  if (!m) return null
  let path: string
  try { path = decodeURIComponent(m[2]) } catch { return null }
  if (!DOC_BUCKETS.includes(m[1]) || path.includes('..') || path.startsWith('/')) return null
  return { bucket: m[1], path }
}

export type DocRow = { id: string; user_id: string; type: string | null; status: string | null; expiry_date: string | null; show_on_profile: boolean | null; document_url?: string | null }

/** Shown to visitors only when the escort switched it on, it is not past its expiry date, and it is either one of our paid P/EVO reviews (approved) or an escort's own upload (we do not check those). */
export function isPublic(row: DocRow, today = new Date().toISOString().slice(0, 10)): boolean {
  return (row.status === 'approved' || row.status === 'uploaded') && row.show_on_profile === true && (!row.expiry_date || String(row.expiry_date).slice(0, 10) >= today)
}

// Uploading documents (and keeping them on the public profile) belongs to a paid plan. While plans are free (FREE_LAUNCH)
// everyone has it; when charging starts, only a paid plan does, and a lapsed one takes the documents off the profile.
const PAID_PLANS = ['member', 'pro', 'fleet_starter', 'fleet_plus', 'fleet_pro']
export function canUseDocs(tier: string | null | undefined, role: string | null | undefined, freeLaunch = FREE_LAUNCH): boolean {
  if (role === 'admin') return true
  if (freeLaunch) return true
  return !!tier && PAID_PLANS.includes(tier)
}
