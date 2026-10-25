// Shared in-memory Supabase / session stand-in for the hostile-audit tests.
// Route modules call createClient() at import time, so this state lives on globalThis
// and is read on every query rather than snapshotted.

export type Filter = { op: 'eq' | 'neq' | 'in' | 'lt' | 'gt' | 'gte' | 'or'; col: string; val: unknown }

export type HostileDb = {
  tables: Record<string, Record<string, unknown>[]>
  calls: Array<{ table: string; op: string; payload: unknown; filters: Filter[] }>
  pushes: Array<{ userId: string; payload: unknown }>
  storageOps: Array<Record<string, unknown>>
  authOps: Array<Record<string, unknown>>
  stripeCalls: Array<Record<string, unknown>>
  stripeEvent: unknown
  sessionUser: { id: string; email?: string } | null
  fail: { table: string; op: string } | null
  /** Next N pending-bid existence checks return no rows, even if one was just inserted. */
  blindBidChecks: number
  /** When set, SELECT uses this snapshot instead of the live table (stale read). */
  selectResults: ((table: string, filters: Filter[]) => Record<string, unknown>[] | null) | null
  /** Runs after a matching UPDATE is chosen and before the payload is written. */
  onUpdate: ((table: string, payload: Record<string, unknown>, filters: Filter[], matched: Record<string, unknown>[]) => void) | null
}

const KEY = '__oehHostileDb'

export function getDb(): HostileDb {
  const g = globalThis as unknown as Record<string, HostileDb>
  if (!g[KEY]) {
    g[KEY] = emptyDb()
  }
  return g[KEY]
}

function emptyDb(): HostileDb {
  return {
    tables: {},
    calls: [],
    pushes: [],
    storageOps: [],
    authOps: [],
    stripeCalls: [],
    stripeEvent: null,
    sessionUser: null,
    fail: null,
    blindBidChecks: 0,
    selectResults: null,
    onUpdate: null,
  }
}

export function resetHostile() {
  const fresh = emptyDb()
  const db = getDb()
  Object.assign(db, fresh)
  db.tables = {}
}

function rowsOf(table: string): Record<string, unknown>[] {
  const db = getDb()
  if (!db.tables[table]) db.tables[table] = []
  return db.tables[table]
}

function matches(row: Record<string, unknown>, filters: Filter[]): boolean {
  return filters.every((f) => {
    if (f.op === 'eq') return row[f.col] === f.val
    if (f.op === 'neq') return row[f.col] !== f.val
    if (f.op === 'in') return Array.isArray(f.val) && (f.val as unknown[]).includes(row[f.col])
    if (f.op === 'lt') return String(row[f.col] ?? '') < String(f.val ?? '')
    if (f.op === 'gt') return String(row[f.col] ?? '') > String(f.val ?? '')
    if (f.op === 'gte') return String(row[f.col] ?? '') >= String(f.val ?? '')
    if (f.op === 'or') {
      const parts = String(f.val).split(',')
      return parts.some((part) => {
        const m = part.match(/^([A-Za-z0-9_]+)\.eq\.(.+)$/)
        if (!m) return false
        return String(row[m[1]] ?? '') === m[2]
      })
    }
    return true
  })
}

type Mode = 'many' | 'single' | 'maybe'

class Query {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: unknown = null
  private filters: Filter[] = []
  private limited: number | null = null
  private selected = false

  constructor(private table: string) {}

  select() {
    this.selected = true
    return this
  }
  insert(payload: unknown) {
    this.op = 'insert'
    this.payload = payload
    return this
  }
  update(payload: unknown) {
    this.op = 'update'
    this.payload = payload
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }
  eq(col: string, val: unknown) {
    this.filters.push({ op: 'eq', col, val })
    return this
  }
  neq(col: string, val: unknown) {
    this.filters.push({ op: 'neq', col, val })
    return this
  }
  in(col: string, val: unknown) {
    this.filters.push({ op: 'in', col, val })
    return this
  }
  lt(col: string, val: unknown) {
    this.filters.push({ op: 'lt', col, val })
    return this
  }
  gt(col: string, val: unknown) {
    this.filters.push({ op: 'gt', col, val })
    return this
  }
  gte(col: string, val: unknown) {
    this.filters.push({ op: 'gte', col, val })
    return this
  }
  or(val: string) {
    this.filters.push({ op: 'or', col: '', val })
    return this
  }
  order() {
    return this
  }
  limit(n: number) {
    this.limited = n
    return this
  }
  contains() {
    return this
  }
  maybeSingle() {
    return this.exec('maybe')
  }
  single() {
    return this.exec('single')
  }
  then<T>(resolve: (v: unknown) => T, reject?: (e: unknown) => T) {
    return this.exec('many').then(resolve, reject)
  }

  private async exec(mode: Mode) {
    const db = getDb()
    const filters = this.filters.map((f) => ({ ...f }))
    db.calls.push({ table: this.table, op: this.op, payload: this.payload, filters })

    if (db.fail && db.fail.table === this.table && db.fail.op === this.op) {
      return { data: null, error: { message: 'forced failure' } }
    }

    const tableRows = rowsOf(this.table)

    if (this.op === 'select') {
      if (
        db.blindBidChecks > 0 &&
        this.table === 'bids' &&
        filters.some((f) => f.op === 'eq' && f.col === 'status' && f.val === 'pending')
      ) {
        db.blindBidChecks -= 1
        return shape([], mode)
      }
      const override = db.selectResults?.(this.table, filters)
      const found = override ?? tableRows.filter((row) => matches(row, filters))
      const sliced = this.limited != null ? found.slice(0, this.limited) : found
      return shape(sliced, mode)
    }

    if (this.op === 'insert') {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload]
      const inserted: Record<string, unknown>[] = []
      for (const raw of incoming) {
        const row = { id: crypto.randomUUID(), ...(raw as Record<string, unknown>) }
        tableRows.push(row)
        inserted.push(row)
      }
      return shape(inserted, mode)
    }

    if (this.op === 'update') {
      const matched = tableRows.filter((row) => matches(row, filters))
      db.onUpdate?.(this.table, (this.payload ?? {}) as Record<string, unknown>, filters, matched)
      for (const row of matched) Object.assign(row, this.payload)
      if (!this.selected && mode === 'many') return { data: null, error: null }
      return shape(matched, mode)
    }

    const kept = tableRows.filter((row) => !matches(row, filters))
    db.tables[this.table] = kept
    return { data: null, error: null }
  }
}

function shape(rows: Record<string, unknown>[], mode: Mode) {
  if (mode === 'many') return { data: rows, error: null }
  if (mode === 'maybe') return { data: rows[0] ?? null, error: null }
  if (rows.length === 1) return { data: rows[0], error: null }
  return { data: null, error: { message: 'JSON object requested, returned ' + rows.length, code: 'PGRST116' } }
}

function storageApi() {
  return {
    from(bucket: string) {
      return {
        async upload(path: string, _body: unknown, opts?: { contentType?: string }) {
          getDb().storageOps.push({ op: 'upload', bucket, path, contentType: opts?.contentType ?? null })
          return { error: null }
        },
        getPublicUrl(path: string) {
          getDb().storageOps.push({ op: 'getPublicUrl', bucket, path })
          const publicUrl = `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}`
          return { data: { publicUrl } }
        },
        async createSignedUrl(path: string, expiresIn: number) {
          getDb().storageOps.push({ op: 'createSignedUrl', bucket, path, expiresIn })
          return {
            data: { signedUrl: `https://example.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=test` },
            error: null,
          }
        },
        async remove(paths: string[]) {
          getDb().storageOps.push({ op: 'remove', bucket, paths })
          return { data: [], error: null }
        },
        async list(prefix?: string) {
          getDb().storageOps.push({ op: 'list', bucket, prefix: prefix ?? '' })
          return { data: [], error: null }
        },
      }
    },
  }
}

export function createMockClient(_kind: 'service' | 'user') {
  return {
    from(table: string) {
      return new Query(table)
    },
    auth: {
      getUser: async () => ({ data: { user: getDb().sessionUser }, error: null }),
      admin: {
        deleteUser: async (id: string) => {
          getDb().authOps.push({ op: 'deleteUser', id })
          return { data: { user: null }, error: null }
        },
        updateUserById: async (id: string, attrs: unknown) => {
          getDb().authOps.push({ op: 'updateUserById', id, attrs })
          return { data: { user: null }, error: null }
        },
      },
    },
    storage: storageApi(),
  }
}
