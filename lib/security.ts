// Small helpers shared by the API routes.

export function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// A same-site path from user input ("/dashboard"), or the fallback. Refuses "//host", "/\host",
// control characters (browsers strip tabs and newlines inside a URL) and anything that is not a path.
export function safeRedirectPath(raw: unknown, fallback = '/dashboard'): string {
  if (typeof raw !== 'string') return fallback
  let p = raw.trim()
  if (!p) return fallback
  if (!p.startsWith('/')) p = '/' + p
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(p) || p.startsWith('//')) return fallback
  try {
    const u = new URL(p, 'https://oeh.invalid')
    if (u.origin !== 'https://oeh.invalid') return fallback
    return u.pathname + u.search + u.hash
  } catch {
    return fallback
  }
}

// A storage-key-safe file name: letters, digits, dot, dash, underscore only, and a bounded length.
export function safeFileName(name: unknown): string {
  const base = String(name ?? 'file').split(/[\\/]/).pop() || 'file'
  return base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '').slice(-80) || 'file'
}

// Uploaded verification documents: PDF or an image, nothing else.
export const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
