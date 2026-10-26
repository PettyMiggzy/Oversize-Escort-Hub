'use client'
import { useState } from 'react'

const REASONS = [
  ['taken', 'It is already filled or taken'],
  ['scam', 'Looks like a scam'],
  ['spam', 'Spam or an ad'],
  ['fake_rate', 'The rate or details look fake'],
  ['duplicate', 'Posted more than once'],
  ['other', 'Something else'],
] as const

// A small, quiet way for a signed-in user to flag a load. Two escorts saying it is taken, or three people reporting a problem, take it off the board.
export default function ReportLoad({ loadId }: { loadId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('taken')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true); setMsg('')
    const res = await fetch('/api/loads/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loadId, reason }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    setMsg(res.ok ? (reason === 'taken' ? 'Thanks. If another escort says the same, it comes off the board.' : 'Thanks. We will look at it.') : d.error || 'Could not send the report.')
    if (res.ok) setOpen(false)
  }

  if (!open) {
    return (
      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={() => setOpen(true)} className="ui-link" style={{ background: 'none', border: 0, cursor: 'pointer', minHeight: 44, fontSize: 14 }}>Report this load</button>
        {msg && <p className="ui-ok" style={{ textAlign: 'center' }}>{msg}</p>}
      </div>
    )
  }
  return (
    <div className="ui-card">
      <h2>Report this load</h2>
      <label className="ui-label" htmlFor="rep-reason">What is wrong?</label>
      <select id="rep-reason" className="ui-select" value={reason} onChange={(e) => setReason(e.target.value)}>
        {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {msg && <p className="ui-err">{msg}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className={busy ? 'ui-btn dim' : 'ui-btn'} disabled={busy} onClick={send}>Send report</button>
        <button className="ui-btn ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}
