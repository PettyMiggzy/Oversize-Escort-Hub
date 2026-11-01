'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

type Exp = { id: string; kind: string; amount: number; miles: number | null; note: string | null; incurred_on: string }
const KINDS: [string, string][] = [['mileage', 'Mileage'], ['fuel', 'Fuel'], ['lodging', 'Lodging'], ['meal', 'Meals'], ['toll', 'Tolls'], ['other', 'Other']]
const kindLabel = (k: string) => KINDS.find(([v]) => v === k)?.[1] ?? k
const money = (n: number) => `$${n.toFixed(2)}`
const todayStr = () => new Date().toISOString().slice(0, 10)
// a spreadsheet treats a cell starting with = + - @ as a formula: neutralise it
const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"` }

export default function ExpensesTool() {
  const [rows, setRows] = useState<Exp[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'signin' | 'error'>('loading')
  const [month, setMonth] = useState('all')
  const [kind, setKind] = useState('fuel')
  const [amount, setAmount] = useState('')
  const [miles, setMiles] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/expenses').then(async (r) => {
      if (r.status === 401) return setState('signin')
      if (!r.ok) return setState('error')
      setRows((await r.json()).expenses ?? []); setState('ok')
    }).catch(() => setState('error'))
  }, [])

  const months = useMemo(() => Array.from(new Set(rows.map((r) => r.incurred_on.slice(0, 7)))).sort().reverse(), [rows])
  const shown = useMemo(() => rows.filter((r) => month === 'all' || r.incurred_on.startsWith(month)), [rows, month])
  const total = shown.reduce((a, r) => a + Number(r.amount), 0)
  const totalMiles = shown.reduce((a, r) => a + Number(r.miles || 0), 0)
  const byKind = KINDS.map(([k, l]) => ({ k, l, sum: shown.filter((r) => r.kind === k).reduce((a, r) => a + Number(r.amount), 0) })).filter((x) => x.sum > 0)

  async function add() {
    setMsg('')
    const amt = Number(amount)
    if (!amount || !Number.isFinite(amt) || amt < 0) return setMsg('Enter an amount.')
    setBusy(true)
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, amount: amt, miles: miles || null, note: note || null, incurred_on: date }) })
      const d = await res.json()
      if (!res.ok) return setMsg(d.error || 'Could not save.')
      setRows((p) => [d.expense, ...p].sort((a, b) => b.incurred_on.localeCompare(a.incurred_on)))
      setAmount(''); setMiles(''); setNote(''); setMsg('Saved.')
    } finally { setBusy(false) }
  }

  async function del(id: string) {
    const res = await fetch('/api/expenses?id=' + encodeURIComponent(id), { method: 'DELETE' })
    if (res.ok) { setRows((p) => p.filter((r) => r.id !== id)); setMsg('') }
  }

  function csv() {
    const head = ['Date', 'Type', 'Amount', 'Miles', 'Note']
    const body = shown.map((r) => [r.incurred_on, kindLabel(r.kind), Number(r.amount).toFixed(2), r.miles ?? '', r.note ?? ''].map(cell).join(','))
    const blob = new Blob([[head.map(cell).join(','), ...body].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `expenses-${month === 'all' ? 'all' : month}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  const label = { fontSize: 12, color: 'var(--ui-mute, #8b95a5)', display: 'block', margin: '0 0 4px' } as const

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 900 }}>
          <PageTitle eyebrow="Tools" title="Expense tracker" lead="Log fuel, lodging, tolls and miles as you go. Add them up by month and download a spreadsheet for your taxes. Free." />
          {state === 'loading' && <p className="ui-meta">Loading…</p>}
          {state === 'signin' && <div className="ui-card"><p style={{ margin: 0 }}>Sign in to keep your expenses. <Link href="/signin" style={{ color: 'var(--ui-or)' }}>Sign in</Link></p></div>}
          {state === 'error' && <div className="ui-card"><p style={{ margin: 0 }}>Could not load your expenses. Try again in a minute.</p></div>}
          {state === 'ok' && (
            <div className="ui-stack">
              <div className="ui-card">
                <h2>Add an expense</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, alignItems: 'end' }}>
                  <label><span style={label}>Type</span><select className="ui-select" value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                  <label><span style={label}>Amount ($)</span><input className="ui-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
                  <label><span style={label}>Miles (optional)</span><input className="ui-input" inputMode="decimal" value={miles} onChange={(e) => setMiles(e.target.value)} /></label>
                  <label><span style={label}>Date</span><input className="ui-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                </div>
                <label style={{ display: 'block', marginTop: 12 }}><span style={label}>Note (optional)</span><input className="ui-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Load, station, motel…" /></label>
                <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button className="ui-btn" disabled={busy} onClick={add}>{busy ? 'Saving…' : 'Add expense'}</button>
                  {msg && <span className="ui-note" role="status">{msg}</span>}
                </div>
              </div>

              <div className="ui-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ margin: 0 }}>Totals</h2>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select className="ui-select" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
                      <option value="all">All time</option>{months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button className="ui-btn ghost" disabled={!shown.length} onClick={csv}>Download CSV</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <div><div className="ui-k">Spent</div><div style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>{money(total)}</div></div>
                  <div><div className="ui-k">Miles logged</div><div style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>{totalMiles.toLocaleString()}</div></div>
                  {byKind.map((x) => <div key={x.k}><div className="ui-k">{x.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{money(x.sum)}</div></div>)}
                </div>
                {rows.length >= 100 && <p className="ui-note" style={{ margin: '12px 0 0' }}>Showing your 100 most recent entries.</p>}
              </div>

              <div className="ui-card">
                <h2>Entries</h2>
                {!shown.length ? <p className="ui-note" style={{ margin: 0 }}>Nothing here yet.</p> : (
                  <div style={{ display: 'grid' }}>
                    {shown.map((r) => (
                      <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '92px 90px 90px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--ui-line)' }}>
                        <span className="ui-meta">{r.incurred_on}</span>
                        <span style={{ color: '#fff' }}>{kindLabel(r.kind)}</span>
                        <strong style={{ color: '#fff' }}>{money(Number(r.amount))}</strong>
                        <span className="ui-note" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.miles ? `${r.miles} mi` : ''}{r.miles && r.note ? ' · ' : ''}{r.note ?? ''}</span>
                        <button className="ui-btn ghost" style={{ minHeight: 34, padding: '4px 12px' }} onClick={() => del(r.id)} aria-label="Delete expense">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="ui-note">A simple log for your own records. It is not tax advice. Talk to your accountant about what you can deduct. <Link href="/tools/invoice" style={{ color: 'var(--ui-or)' }}>Invoice maker →</Link></p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
