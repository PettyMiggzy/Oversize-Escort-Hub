/**
 * Static scan of supabase.from() column names in app/, lib/, and components/.
 * The production column list is passed in by the test so the list lives with the assertion.
 */
import fs from 'node:fs'
import path from 'node:path'

export type Schema = Record<string, readonly string[]>

export type ColumnUse = {
  file: string
  line: number
  table: string
  column: string
  kind: string
}

export type ScanResult = {
  uses: ColumnUse[]
  mismatches: ColumnUse[]
  unknownTables: { file: string; line: number; table: string }[]
  unresolved: { file: string; line: number; detail: string }[]
}

const SKIP_RECEIVER = new Set([
  'storage', 'Buffer', 'Array', 'Uint8Array', 'Int8Array', 'Uint8ClampedArray',
  'Float32Array', 'Set', 'Map', 'path', 'url', 'Headers', 'FormData', 'Object', 'Promise',
])

const COL_METHODS = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains',
  'containedBy', 'overlaps', 'textSearch', 'not', 'filter', 'order',
])

const OR_OPS = 'eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|ov|sl|sr|nxl|nxr|adj|fts|plfts|phfts|wfts|not'

export const BILLING_FILES = new Set([
  'app/api/checkout/route.ts',
  'app/api/bgc-checkout/route.ts',
  'app/api/stripe/portal/route.ts',
  'app/api/portal/route.ts',
  'app/api/webhook/route.ts',
  'app/api/bgc/verify-session/route.ts',
  'app/pricing/page.tsx',
  'app/checkout/page.tsx',
  'app/join/page.tsx',
  'lib/stripe-utils.ts',
])

type Tok = { type: 'ident' | 'string' | 'template' | 'punct' | 'num'; value: string; start: number; inners?: Tok[][] }

function tokenize(src: string): Tok[] {
  const tokens: Tok[] = []
  const n = src.length
  let i = 0
  const push = (type: Tok['type'], value: string, start: number, extra?: Partial<Tok>) => {
    tokens.push({ type, value, start, ...extra })
  }
  while (i < n) {
    const c = src[i]
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t') { i++; continue }
    if (c === '/' && src[i + 1] === '/') { i += 2; while (i < n && src[i] !== '\n') i++; continue }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue }
    if (c === "'" || c === '"') {
      const q = c
      const start = i
      i++
      let val = ''
      while (i < n) {
        if (src[i] === '\\') { val += src[i + 1] ?? ''; i += 2; continue }
        if (src[i] === q) { i++; break }
        val += src[i++]
      }
      push('string', val, start)
      continue
    }
    if (c === '`') {
      const start = i
      i++
      let cur = ''
      const parts: string[] = []
      const inners: Tok[][] = []
      while (i < n) {
        if (src[i] === '\\') { cur += src[i + 1] ?? ''; i += 2; continue }
        if (src[i] === '`') { i++; parts.push(cur); break }
        if (src[i] === '$' && src[i + 1] === '{') {
          parts.push(cur)
          cur = ''
          i += 2
          const innerStart = i
          let depth = 1
          while (i < n && depth > 0) {
            if (src[i] === "'" || src[i] === '"' || src[i] === '`') {
              const q = src[i]
              i++
              while (i < n) {
                if (src[i] === '\\') { i += 2; continue }
                if (src[i] === q) { i++; break }
                i++
              }
              continue
            }
            if (src[i] === '{') depth++
            else if (src[i] === '}') depth--
            if (depth > 0) i++
          }
          const innerSrc = src.slice(innerStart, i)
          inners.push(tokenize(innerSrc))
          if (src[i] === '}') i++
          continue
        }
        cur += src[i++]
      }
      push('template', parts.join('\u0000'), start, { inners })
      continue
    }
    if (/[0-9]/.test(c)) {
      const start = i
      while (i < n && /[0-9._]/.test(src[i])) i++
      push('num', src.slice(start, i), start)
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      const start = i
      i++
      while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++
      push('ident', src.slice(start, i), start)
      continue
    }
    const two = src.slice(i, i + 2)
    const three = src.slice(i, i + 3)
    if (three === '?.') { push('punct', '.', i); i += 2; continue }
    if (three === '...' || three === '===' || three === '!==' || three === '=>') {
      push('punct', three, i)
      i += 3
      continue
    }
    if (['==', '!=', '<=', '>=', '&&', '||', '??', '+=', '-=', '++', '--'].includes(two)) {
      push('punct', two, i)
      i += 2
      continue
    }
    push('punct', c, i)
    i++
  }
  return tokens
}

function lineOf(src: string, index: number) {
  let line = 1
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') line++
  return line
}

function walkFiles(dir: string, rel: string, out: string[]) {
  if (!fs.existsSync(dir)) return
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'android') continue
    const abs = path.join(dir, ent.name)
    const r = rel ? `${rel}/${ent.name}` : ent.name
    if (ent.isDirectory()) walkFiles(abs, r, out)
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(r)
  }
}

function splitComma(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  let q: string | null = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      cur += c
      if (c === '\\') { cur += s[++i] ?? ''; continue }
      if (c === q) q = null
      continue
    }
    if (c === '"' || c === "'") { q = c; cur += c; continue }
    if (c === '(') depth++
    if (c === ')') depth--
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue }
    cur += c
  }
  if (cur.trim()) parts.push(cur)
  return parts
}

function addUse(uses: ColumnUse[], file: string, line: number, table: string, column: string, kind: string) {
  const col = column.replace(/"/g, '').trim()
  if (!col || col === '*' || !/^[A-Za-z_][\w]*$/.test(col)) return
  uses.push({ file, line, table, column: col, kind })
}

function parseSelectItem(raw: string, parent: string, file: string, line: number, uses: ColumnUse[]) {
  let s = raw.trim()
  if (!s || s === '*') return
  let embed: string | null = null
  if (s.endsWith(')')) {
    let depth = 0
    let open = -1
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === ')') depth++
      else if (s[i] === '(') {
        depth--
        if (depth === 0) { open = i; break }
      }
    }
    if (open >= 0) {
      embed = s.slice(open + 1, -1)
      s = s.slice(0, open).trim()
    }
  }
  s = s.replace(/::[A-Za-z_][\w\s]*/g, '').replace(/->>?[A-Za-z_][\w]*/g, '').trim()
  let hint: string | null = null
  const bang = s.indexOf('!')
  if (bang >= 0) {
    hint = s.slice(bang + 1).trim()
    s = s.slice(0, bang).trim()
  }
  let alias: string | null = null
  let name = s
  const colon = s.indexOf(':')
  if (colon >= 0) {
    alias = s.slice(0, colon).trim()
    name = s.slice(colon + 1).trim()
  }
  name = name.replace(/"/g, '')
  alias = alias ? alias.replace(/"/g, '') : null
  if (embed !== null) {
    // Filled in by the caller via schema lookup — this helper receives schema through a closure set later.
    parseEmbed(alias, name, hint, embed, parent, file, line, uses)
    return
  }
  const column = name
  if (column && column !== '*') addUse(uses, file, line, parent, column, 'select')
}

let SCHEMA: Schema = {}

function known(table: string) {
  return Object.prototype.hasOwnProperty.call(SCHEMA, table)
}

function parseEmbed(alias: string | null, name: string, hint: string | null, embed: string, parent: string, file: string, line: number, uses: ColumnUse[]) {
  let embedTable = name
  let parentFk: string | null = null
  if (known(name)) embedTable = name
  else if (alias && known(alias)) {
    embedTable = alias
    parentFk = name
  } else if (alias) embedTable = name
  if (parentFk && !/^(inner|left|outer)$/i.test(parentFk) && !parentFk.endsWith('_fkey')) {
    addUse(uses, file, line, parent, parentFk, 'fk')
  }
  if (hint && !/^(inner|left|outer)$/i.test(hint) && !hint.endsWith('_fkey')) {
    addUse(uses, file, line, parent, hint, 'fk')
  }
  if (embedTable === 'certifications' || embedTable === 'moni_submissions') return
  for (const part of splitComma(embed)) parseSelectItem(part, embedTable, file, line, uses)
}

function orColumns(text: string): string[] {
  const cols: string[] = []
  const re = new RegExp(`([A-Za-z_][\\w]*)\\.(?:${OR_OPS})\\b`, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) cols.push(m[1])
  return cols
}

function templateText(tok: Tok, consts: Map<string, string>): { text: string; dynamic: boolean } {
  const parts = tok.value.split('\u0000')
  const inners = tok.inners ?? []
  let text = ''
  let dynamic = false
  for (let i = 0; i < parts.length; i++) {
    text += parts[i]
    if (i < inners.length) {
      const inner = inners[i]
      if (inner.length === 1 && inner[0].type === 'ident' && consts.has(inner[0].value)) text += consts.get(inner[0].value)
      else dynamic = true
    }
  }
  return { text, dynamic }
}

function skipBalanced(tokens: Tok[], i: number, open: string, close: string): number {
  let depth = 0
  for (let k = i; k < tokens.length; k++) {
    const v = tokens[k].value
    if (v === open) depth++
    else if (v === close) {
      depth--
      if (depth === 0) return k
    }
  }
  return tokens.length - 1
}

/** Index of the comma or closing brace that ends a value, without consuming it. */
function endOfValue(tokens: Tok[], k: number): number {
  let depth = 0
  while (k < tokens.length) {
    const v = tokens[k].value
    if (v === '{' || v === '(' || v === '[') depth++
    else if (v === '}' || v === ')' || v === ']') {
      if (depth === 0) return k
      depth--
    } else if ((v === ',' || v === ';') && depth === 0) return k
    k++
  }
  return k
}

function objectKeys(tokens: Tok[], i: number): { keys: string[]; computed: Tok[][]; end: number } {
  // i points at '{'
  const keys: string[] = []
  const computed: Tok[][] = []
  let k = i + 1
  while (k < tokens.length) {
    const t = tokens[k]
    if (t.value === '}') return { keys, computed, end: k }
    if (t.value === ',') { k++; continue }
    if (t.value === '...') {
      const n = tokens[k + 1]
      if (n?.value === '{') {
        const inner = objectKeys(tokens, k + 1)
        keys.push(...inner.keys)
        computed.push(...inner.computed)
        k = inner.end + 1
        continue
      }
      if (n?.value === '(') {
        const end = skipBalanced(tokens, k + 1, '(', ')')
        for (let p = k + 2; p < end; p++) {
          if (tokens[p].value === '{') {
            const inner = objectKeys(tokens, p)
            keys.push(...inner.keys)
            computed.push(...inner.computed)
            p = inner.end
          }
        }
        k = end + 1
        continue
      }
      k = endOfValue(tokens, k + 1)
      continue
    }
    if (t.value === '[') {
      const end = skipBalanced(tokens, k, '[', ']')
      const after = tokens[end + 1]
      if (after?.value === ':') {
        computed.push(tokens.slice(k + 1, end))
        k = endOfValue(tokens, end + 2)
        continue
      }
      // array value, not a computed key
      k = end + 1
      continue
    }
    if ((t.type === 'ident' || t.type === 'string') && tokens[k + 1]?.value === ':') {
      keys.push(t.value)
      k = endOfValue(tokens, k + 2)
      continue
    }
    if (t.type === 'ident' && (tokens[k + 1]?.value === ',' || tokens[k + 1]?.value === '}')) {
      keys.push(t.value)
      k++
      continue
    }
    k++
  }
  return { keys, computed, end: k }
}

function parseArgs(tokens: Tok[], openIdx: number): { args: { tokens: Tok[] }[]; end: number } {
  // openIdx points at '('
  const args: { tokens: Tok[] }[] = []
  let cur: Tok[] = []
  let depth = 0
  let k = openIdx
  while (k < tokens.length) {
    const v = tokens[k].value
    if (v === '(' || v === '{' || v === '[') depth++
    if (v === ')' || v === '}' || v === ']') depth--
    if (depth === 1 && v === ',' && k !== openIdx) {
      args.push({ tokens: cur })
      cur = []
      k++
      continue
    }
    if (depth === 0 && k !== openIdx) {
      args.push({ tokens: cur })
      return { args, end: k }
    }
    if (k !== openIdx) cur.push(tokens[k])
    k++
  }
  args.push({ tokens: cur })
  return { args, end: k }
}

function constStrings(tokens: Tok[]): Map<string, string> {
  const map = new Map<string, string>()
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type === 'ident' && tokens[i + 1].value === '=' && tokens[i + 2].type === 'string') {
      const val = tokens[i + 2].value
      if (/^[A-Za-z_][\w]*(\s*,\s*[A-Za-z_][\w]*)*$/.test(val)) map.set(tokens[i].value, val)
    }
  }
  return map
}

function stringBranches(tokens: Tok[]): string[] | null {
  // ternary branches that are string literals: ? 'a' : 'b'
  const out: string[] = []
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].value === '?' && tokens[i + 1].type === 'string') {
      // find ':' at depth 0 after
      let depth = 0
      for (let k = i + 2; k < tokens.length; k++) {
        const v = tokens[k].value
        if (v === '(' || v === '{' || v === '[') depth++
        else if (v === ')' || v === '}' || v === ']') depth--
        else if (depth === 0 && v === ':' && tokens[k + 1]?.type === 'string') {
          out.push(tokens[i + 1].value, tokens[k + 1].value)
          return out
        }
      }
    }
  }
  return out.length ? out : null
}

function identValues(tokens: Tok[], name: string): string[] | null {
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i].type === 'ident' && tokens[i].value === name && tokens[i + 1].value === '=') {
      // statement tokens until ; or newline-ish depth 0 comma? take until ; at depth 0 or 40 tokens
      const stmt: Tok[] = []
      let depth = 0
      for (let k = i + 2; k < tokens.length && k < i + 80; k++) {
        const v = tokens[k].value
        if (v === '(' || v === '{' || v === '[') depth++
        else if (v === ')' || v === '}' || v === ']') depth--
        if (depth === 0 && (v === ';' || v === '\n')) break
        stmt.push(tokens[k])
        if (depth < 0) break
      }
      const branches = stringBranches(stmt)
      if (branches) return branches
      if (stmt[0]?.type === 'string') return [stmt[0].value]
    }
  }
  return null
}

function expandComputed(expr: Tok[], tokens: Tok[]): string[] | null {
  if (expr.length === 1 && expr[0].type === 'ident') return identValues(tokens, expr[0].value)
  if (expr.length === 1 && expr[0].type === 'template') {
    const tok = expr[0]
    const parts = tok.value.split('\u0000')
    const inners = tok.inners ?? []
    if (inners.length === 1 && inners[0].length === 1 && inners[0][0].type === 'ident') {
      const vals = identValues(tokens, inners[0][0].value)
      if (!vals) return null
      return vals.map((v) => parts[0] + v + (parts[1] ?? ''))
    }
  }
  return null
}

/** Index of `=` that assigns `tokens[from]`, or -1. Accepts `name =` and `name: Type =` only. */
function assignmentEq(tokens: Tok[], from: number): number {
  if (tokens[from - 1]?.value === '.') return -1
  const next = tokens[from + 1]?.value
  if (next === '=') return from + 1
  if (next !== ':') return -1
  let depth = 0
  for (let k = from + 2; k < tokens.length && k < from + 40; k++) {
    const v = tokens[k].value
    if (v === '<' || v === '(' || v === '{' || v === '[') depth++
    else if (v === '>' || v === ')' || v === '}' || v === ']') {
      if (depth === 0) return -1
      depth--
    } else if (depth === 0 && v === '=') return k
    else if (depth === 0 && (v === ';' || v === ',' || v === ')')) return -1
  }
  return -1
}

/** End index (exclusive) of the expression that starts at `start`. Stops before the next statement. */
function endOfInitializer(tokens: Tok[], start: number): number {
  let k = start
  let depth = 0
  let expect = true
  while (k < tokens.length) {
    const v = tokens[k].value
    if (v === '{' || v === '(' || v === '[') {
      depth++
      expect = true
      k++
      continue
    }
    if (v === '}' || v === ')' || v === ']') {
      if (depth === 0) return k
      depth--
      expect = false
      k++
      if (depth === 0) {
        const n = tokens[k]?.value
        if (n === '.' || n === '(' || n === '[' || n === '?' || n === '??' || n === '&&' || n === '||' || n === '=>' || n === 'as' || n === 'satisfies') continue
        return k
      }
      continue
    }
    if (depth > 0) {
      k++
      continue
    }
    if (v === ';' || v === ',') return k
    if (expect) {
      if (v === 'await' || v === 'void' || v === 'typeof' || v === 'new' || v === '!' || v === '~' || v === '+' || v === '-') {
        k++
        continue
      }
      expect = false
      k++
      continue
    }
    if (v === '.' || v === '?.') {
      k++
      if (tokens[k]?.type === 'ident') k++
      expect = false
      continue
    }
    if (
      v === '=>' || v === '?' || v === '??' || v === '&&' || v === '||' || v === 'as' || v === 'satisfies' ||
      v === '+' || v === '-' || v === '*' || v === '/' || v === '===' || v === '!==' || v === '==' || v === '!=' ||
      v === '<' || v === '>' || v === '<=' || v === '>=' || v === 'in' || v === 'instanceof'
    ) {
      expect = true
      k++
      continue
    }
    return k
  }
  return k
}

function statementOf(tokens: Tok[], eqIdx: number): Tok[] {
  return tokens.slice(eqIdx + 1, endOfInitializer(tokens, eqIdx + 1))
}

function assignedKeys(tokens: Tok[], name: string): { keys: string[]; computed: Tok[][] } {
  const keys: string[] = []
  const computed: Tok[][] = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'ident' || tokens[i].value !== name) continue
    if (tokens[i + 1]?.value === '.' && tokens[i + 2]?.type === 'ident' && tokens[i + 3]?.value === '=') {
      keys.push(tokens[i + 2].value)
      continue
    }
    const eqAt = assignmentEq(tokens, i)
    if (eqAt < 0) continue
    const stmt = statementOf(tokens, eqAt)
    for (let p = 0; p < stmt.length; p++) {
      if (stmt[p].value === '{') {
        const obj = objectKeys(stmt, p)
        keys.push(...obj.keys)
        computed.push(...obj.computed)
        p = obj.end
      }
    }
  }
  return { keys, computed }
}

function tupleTables(tokens: Tok[]): { table: string; column: string }[] | null {
  // const NAME = [ ['table','col'], ... ]  used as for (const [table, column] of NAME)
  let source: string | null = null
  for (let i = 0; i < tokens.length - 6; i++) {
    if (tokens[i].value === 'const' && tokens[i + 1].value === '[' && tokens[i + 2].value === 'table' && tokens[i + 4].value === 'column') {
      // for (const [table, column] of SOURCE
      for (let k = i; k < i + 12 && k < tokens.length; k++) {
        if (tokens[k].value === 'of' && tokens[k + 1]?.type === 'ident') source = tokens[k + 1].value
      }
    }
  }
  if (!source) return null
  for (let i = 0; i < tokens.length - 2; i++) {
    const eq = tokens[i].type === 'ident' && tokens[i].value === source ? assignmentEq(tokens, i) : -1
    if (eq >= 0 && tokens[eq + 1]?.value === '[') {
      const end = skipBalanced(tokens, eq + 1, '[', ']')
      const pairs: { table: string; column: string }[] = []
      for (let k = i + 2; k < end; k++) {
        if (tokens[k].value === '[' && tokens[k + 1]?.type === 'string' && tokens[k + 3]?.type === 'string') {
          pairs.push({ table: tokens[k + 1].value, column: tokens[k + 3].value })
        }
      }
      return pairs
    }
  }
  return null
}

function recordSelect(text: string, table: string, file: string, line: number, uses: ColumnUse[]) {
  if (table === 'certifications' || table === 'moni_submissions') return
  for (const part of splitComma(text)) parseSelectItem(part, table, file, line, uses)
}

function scanFile(rel: string, src: string, uses: ColumnUse[], unknown: ScanResult['unknownTables'], unresolved: ScanResult['unresolved']) {
  const tokens = tokenize(src)
  const consts = constStrings(tokens)
  const pairs = tupleTables(tokens)
  const bindings: { name: string; table: string; depth: number }[] = []
  let depth = 0

  const noteUnknown = (table: string, line: number) => {
    if (table === 'moni_submissions') return
    if (!known(table)) unknown.push({ file: rel, line, table })
  }

  const consider = (table: string, column: string, line: number, kind: string) => {
    if (table === 'certifications' || table === 'moni_submissions') return
    addUse(uses, rel, line, table, column, kind)
    noteUnknown(table, line)
  }

  function applyMethod(table: string, method: string, args: { tokens: Tok[] }[], line: number) {
    if (!table || table === 'certifications' || table === 'moni_submissions') return
    noteUnknown(table, line)
    const first = args[0]?.tokens ?? []
    const a0 = first[0]
    if (method === 'select' && a0) {
      if (a0.type === 'string') recordSelect(a0.value, table, rel, line, uses)
      else if (a0.type === 'template') {
        const { text, dynamic } = templateText(a0, consts)
        if (text.trim()) recordSelect(text, table, rel, line, uses)
        if (dynamic && !text.trim()) unresolved.push({ file: rel, line, detail: `dynamic select on ${table}` })
      } else if (a0.type === 'ident' && consts.has(a0.value)) recordSelect(consts.get(a0.value)!, table, rel, line, uses)
      else if (a0.type === 'ident') unresolved.push({ file: rel, line, detail: `select(${a0.value}) on ${table}` })
      return
    }
    if (method === 'or') {
      if (a0?.type === 'string') for (const c of orColumns(a0.value)) consider(table, c, line, 'or')
      else if (a0?.type === 'template') for (const c of orColumns(templateText(a0, consts).text)) consider(table, c, line, 'or')
      else if (a0?.type === 'ident') {
        const stmt = statementOf(tokens, tokens.findIndex((t, idx) => t === a0 && idx >= 0) >= 0 ? 0 : 0)
        // find assignment of that ident anywhere and scrape or-columns from its statement text via templates
        const cols = new Set<string>()
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i].type === 'ident' && tokens[i].value === a0.value && tokens[i + 1]?.value === '=') {
            for (const tok of statementOf(tokens, i + 1)) {
              if (tok.type === 'template' || tok.type === 'string') for (const c of orColumns(tok.type === 'template' ? templateText(tok, consts).text : tok.value)) cols.add(c)
            }
          }
        }
        if (cols.size) for (const c of cols) consider(table, c, line, 'or')
        else unresolved.push({ file: rel, line, detail: `or(${a0.value}) on ${table}` })
      }
      return
    }
    if (COL_METHODS.has(method)) {
      if (a0?.type === 'string') consider(table, a0.value, line, method)
      else if (a0?.type === 'ident' && method === 'eq' && a0.value === 'column' && pairs) {
        for (const p of pairs) if (p.table === table) consider(table, p.column, line, 'eq')
      } else if (a0?.type === 'ident') unresolved.push({ file: rel, line, detail: `${method}(${a0.value}) on ${table}` })
      return
    }
    if (method === 'match' && a0?.value === '{') {
      const obj = objectKeys(first, 0)
      for (const key of obj.keys) consider(table, key, line, 'match')
      return
    }
    if (method === 'insert' || method === 'update' || method === 'upsert') {
      if (a0?.value === '{' || a0?.value === '[') {
        const scanObj = (at: Tok[], idx: number) => {
          const obj = objectKeys(at, idx)
          for (const key of obj.keys) consider(table, key, line, method)
          for (const expr of obj.computed) {
            const vals = expandComputed(expr, tokens)
            if (vals) for (const v of vals) consider(table, v, line, method)
            else unresolved.push({ file: rel, line, detail: `computed key on ${table}.${method}` })
          }
        }
        if (a0.value === '{') scanObj(first, 0)
        else {
          for (let p = 0; p < first.length; p++) if (first[p].value === '{') {
            scanObj(first, p)
            p = objectKeys(first, p).end
          }
        }
      } else if (a0?.type === 'ident') {
        const found = assignedKeys(tokens, a0.value)
        if (!found.keys.length && !found.computed.length) unresolved.push({ file: rel, line, detail: `${method}(${a0.value}) on ${table}` })
        for (const key of found.keys) consider(table, key, line, method)
        for (const expr of found.computed) {
          const vals = expandComputed(expr, tokens)
          if (vals) for (const v of vals) consider(table, v, line, method)
          else unresolved.push({ file: rel, line, detail: `computed key on ${table}.${method}` })
        }
      }
      const opt = args[1]?.tokens ?? []
      for (let p = 0; p < opt.length; p++) {
        if (opt[p].type === 'ident' && opt[p].value === 'onConflict' && opt[p + 1]?.value === ':' && (opt[p + 2]?.type === 'string' || opt[p + 2]?.type === 'template')) {
          const raw = opt[p + 2].type === 'string' ? opt[p + 2].value : templateText(opt[p + 2], consts).text
          for (const col of raw.split(',')) consider(table, col.trim(), line, 'onConflict')
        }
      }
    }
  }

  function chain(start: number, table: string): number {
    // start is the index of the token AFTER from(...) 
    let k = start
    while (k < tokens.length && tokens[k].value === '.' && tokens[k + 1]?.type === 'ident') {
      const method = tokens[k + 1].value
      if (tokens[k + 2]?.value !== '(') break
      const parsed = parseArgs(tokens, k + 2)
      applyMethod(table, method, parsed.args, lineOf(src, tokens[k + 1].start))
      k = parsed.end + 1
    }
    return k
  }

  const visit = (list: Tok[]) => {
    // re-bind tokens? The helpers close over `tokens` from the outer file.
    // Inner template lists are separate. from() inside templates is rare; handle by scanning those lists
    // with the same `tokens` reference only for the outer list. Inner from() calls are scanned by
    // recursively invoking scan on concatenated... skip: we scan inner lists by a nested walk that
    // still uses outer `tokens` for const lookup but iterates `list`.
  }
  void visit

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.value === '{') { depth++; continue }
    if (t.value === '}') {
      depth--
      while (bindings.length && bindings[bindings.length - 1].depth > depth) bindings.pop()
      continue
    }
    if (t.type === 'ident' && t.value === 'from' && tokens[i - 1]?.value === '.') {
      const recv = tokens[i - 2]
      if (recv?.type === 'ident' && SKIP_RECEIVER.has(recv.value)) continue
      if (tokens[i + 1]?.value !== '(') continue
      const parsed = parseArgs(tokens, i + 1)
      const arg0 = parsed.args[0]?.tokens[0]
      let table = ''
      if (arg0?.type === 'string') table = arg0.value
      else if (arg0?.type === 'ident' && arg0.value === 'table' && pairs) {
        const line = lineOf(src, t.start)
        for (const p of pairs) {
          consider(p.table, p.column, line, 'eq')
        }
        i = parsed.end
        continue
      } else if (arg0?.type === 'ident') {
        unresolved.push({ file: rel, line: lineOf(src, t.start), detail: `from(${arg0.value})` })
        i = parsed.end
        continue
      } else {
        i = parsed.end
        continue
      }
      const line = lineOf(src, t.start)
      noteUnknown(table, line)
      // binding: walk back for ident =
      let bdepth = 0
      for (let b = i - 1; b >= 0; b--) {
        const v = tokens[b].value
        if (v === ')' || v === '}' || v === ']') bdepth++
        else if (v === '(' || v === '{' || v === '[') bdepth--
        if (bdepth !== 0) continue
        if (v === ';' || v === '{' || v === '}') break
        if (v === '=' && tokens[b - 1]?.type === 'ident' && tokens[b - 2]?.value !== '.') {
          const name = tokens[b - 1].value
          for (let x = bindings.length - 1; x >= 0; x--) if (bindings[x].name === name && bindings[x].depth === depth) bindings.splice(x, 1)
          bindings.push({ name, table, depth })
          break
        }
      }
      i = chain(parsed.end + 1, table) - 1
      continue
    }
    // continued query: name.method(
    if (t.type === 'ident' && tokens[i - 1]?.value !== '.' && tokens[i + 1]?.value === '.' && tokens[i + 2]?.type === 'ident' && tokens[i + 3]?.value === '(') {
      let binding: { name: string; table: string } | null = null
      for (let b = bindings.length - 1; b >= 0; b--) {
        if (bindings[b].name === t.value && bindings[b].depth <= depth) { binding = bindings[b]; break }
      }
      if (binding) {
        i = chain(i + 1, binding.table) - 1
      }
    }
    if (t.type === 'template' && t.inners) {
      for (const inner of t.inners) {
        // from() inside an interpolation: scan that token list by temporarily swapping is hard.
        // Inline a shallow search.
        for (let j = 0; j < inner.length; j++) {
          if (inner[j].type === 'ident' && inner[j].value === 'from' && inner[j - 1]?.value === '.') {
            unresolved.push({ file: rel, line: lineOf(src, t.start), detail: 'from() inside template interpolation' })
          }
        }
      }
    }
  }
}

export function scanColumns(root: string, schema: Schema): ScanResult {
  SCHEMA = schema
  const files: string[] = []
  for (const dir of ['app', 'lib', 'components']) walkFiles(path.join(root, dir), dir, files)
  const uses: ColumnUse[] = []
  const unknown: ScanResult['unknownTables'] = []
  const unresolved: ScanResult['unresolved'] = []
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8')
    scanFile(rel, src, uses, unknown, unresolved)
  }
  const mismatches = uses.filter((u) => {
    if (u.table === 'certifications' || u.table === 'moni_submissions') return false
    if (!known(u.table)) return false
    return !schema[u.table].includes(u.column)
  })
  const seen = new Set<string>()
  const unknownTables = unknown.filter((u) => {
    const k = `${u.file}:${u.table}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return { uses, mismatches, unknownTables, unresolved }
}
