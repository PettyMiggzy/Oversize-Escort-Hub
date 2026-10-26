/**
 * Browser files (app/ and components/, not app/api) must not read a sensitive
 * profiles column of someone else. An embed is always another row. A select of
 * `*` or a sensitive column is another row unless the same chain filters id to
 * the signed-in user. Filtering on email (or any sensitive column) is a read too.
 */
import fs from 'node:fs'
import path from 'node:path'

export const SENSITIVE_PROFILE_COLUMNS = [
  'email',
  'phone',
  'bgc_document_url',
  'dd214_url',
  'stripe_customer_id',
  'stripe_subscription_id',
  'dot_number',
  'mc_number',
  'referral_code',
  'referred_by',
  'notification_states',
  'sms_opt_in',
  'bgc_paid',
  'pevo_paid',
  'bgc_pending',
  'dd214_pending',
  'tier1_pending',
  'tier2_pending',
  'prior_role',
  'tier_updated_at',
  'deadhead_active',
  'deadhead_destination_city',
  'deadhead_destination_state',
  'breakdown_protocol_enabled',
  'email_alerts',
  'push_token',
  'tier1_document_url',
  'tier2_document_url',
] as const

const SENSITIVE = new Set<string>(SENSITIVE_PROFILE_COLUMNS)

export type Hit = { file: string; line: number; detail: string }

function walk(dir: string, rel: string, out: string[]) {
  if (!fs.existsSync(dir)) return
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'api' && rel === 'app') continue
    const abs = path.join(dir, ent.name)
    const r = rel ? `${rel}/${ent.name}` : ent.name
    if (ent.isDirectory()) {
      if (r === 'app/api') continue
      walk(abs, r, out)
    } else if (ent.name === 'route.ts') {
      // route handlers (like app/api) run on the server, never in a browser
      continue
    } else if (/\.(ts|tsx)$/.test(ent.name)) out.push(r)
  }
}

function lineOf(src: string, index: number) {
  let line = 1
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') line++
  return line
}

function stripComments(src: string) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, lead) => lead + ' ')
}

function columnsIn(list: string): string[] {
  return list.split(',').map((part) => {
    const name = part.trim().replace(/^["']|["']$/g, '').split(/[!:(\s]/)[0]
    return name.replace(/"/g, '')
  }).filter(Boolean)
}

function ownRow(chain: string) {
  return /\.eq\(\s*['"]id['"]\s*,\s*(?:user|u)\.id\s*\)/.test(chain)
    || /\.eq\(\s*['"]id['"]\s*,\s*uid\s*\)/.test(chain)
    || /\.eq\(\s*['"]id['"]\s*,\s*userId\s*\)/.test(chain)
    || /\.eq\(\s*['"]id['"]\s*,\s*session\.user\.id\s*\)/.test(chain)
}

function chainFrom(src: string, start: number) {
  let depth = 0
  let q: string | null = null
  // start sits on the `.` of `.from(`. Skip that call, then stop before the next query.
  let i = start
  for (; i < src.length && i < start + 1200; i++) {
    const c = src[i]
    if (q) {
      if (c === '\\') { i++; continue }
      if (c === q) q = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') { q = c; continue }
    if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (depth === 0 && i > start && src.startsWith('.from(', i)) return src.slice(start, i)
    else if (c === ';' && depth === 0) return src.slice(start, i)
  }
  return src.slice(start, i)
}

export function scanProfileReads(root: string): Hit[] {
  const files: string[] = []
  for (const dir of ['app', 'components']) walk(path.join(root, dir), dir, files)
  const hits: Hit[] = []
  const seen = new Set<string>()
  const add = (file: string, index: number, src: string, detail: string) => {
    const key = `${file}:${lineOf(src, index)}:${detail}`
    if (seen.has(key)) return
    seen.add(key)
    hits.push({ file, line: lineOf(src, index), detail })
  }

  for (const rel of files) {
    const raw = fs.readFileSync(path.join(root, rel), 'utf8')
    const src = stripComments(raw)

    const embed = /profiles(?:![A-Za-z0-9_]+|:[A-Za-z0-9_]+)?\s*\(([^)]*)\)/g
    let m: RegExpExecArray | null
    while ((m = embed.exec(src))) {
      const cols = columnsIn(m[1])
      if (cols.includes('*') || cols.some((c) => SENSITIVE.has(c))) {
        const bad = cols.includes('*') ? ['*'] : cols.filter((c) => SENSITIVE.has(c))
        add(rel, m.index, src, `embed profiles(${bad.join(', ')})`)
      }
    }

    const fromRe = /\.from\(\s*['"]profiles['"]\s*\)/g
    while ((m = fromRe.exec(src))) {
      const chain = chainFrom(src, m.index)
      const own = ownRow(chain)
      const selectRe = /\.select\(\s*(['"`])([\s\S]*?)\1/g
      let s: RegExpExecArray | null
      while ((s = selectRe.exec(chain))) {
        const cols = columnsIn(s[2])
        const bad = cols.includes('*') ? ['*'] : cols.filter((c) => SENSITIVE.has(c))
        if (!bad.length || own) continue
        add(rel, m.index + s.index, src, `select ${bad.join(', ')} on another profile`)
      }
      const filterRe = /\.(?:eq|neq|in|ilike|like|is|not|filter)\(\s*['"]([A-Za-z_][\w]*)['"]/g
      let f: RegExpExecArray | null
      while ((f = filterRe.exec(chain))) {
        if (!SENSITIVE.has(f[1])) continue
        add(rel, m.index + f.index, src, `filter profiles.${f[1]}`)
      }
    }
  }
  return hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}
