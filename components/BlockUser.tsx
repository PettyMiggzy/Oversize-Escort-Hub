'use client'
import { useState } from 'react'

const REASONS = [
  ['harassment', 'Harassment or abuse'],
  ['scam', 'Looks like a scam'],
  ['spam', 'Spam or an ad'],
  ['fake', 'Fake or misleading profile'],
  ['inappropriate', 'Inappropriate content'],
  ['other', 'Something else'],
] as const

// Block or report another user. Blocking hides each of you from the other everywhere; reporting tells us (we read every report).
export default function BlockUser({ userId, label = 'this user' }: { userId: string; label?: string }) {
  const [mode, setMode] = useState<'' | 'report' | 'block'>('')
  const [reason, setReason] = useState('harassment')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  async function call(url: string, body: unknown, ok: string) {
    setBusy(true); setMsg('')
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.status === 401) { window.location.href = '/signin'; return false }
    setMsg(res.ok ? ok : d.error || 'Something went wrong. Try again.')
    return res.ok
  }

  if (done) return <p className="ui-ok" style={{ textAlign: 'center' }}>{msg}</p>
  return (
    <div style={{ textAlign: 'center', marginTop: 12 }}>
      {!mode && (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="ui-link" style={{ background: 'none', border: 0, cursor: 'pointer', minHeight: 44, fontSize: 14 }} onClick={() => setMode('report')}>Report {label}</button>
          <button type="button" className="ui-link" style={{ background: 'none', border: 0, cursor: 'pointer', minHeight: 44, fontSize: 14 }} onClick={() => setMode('block')}>Block {label}</button>
        </div>
      )}
      {mode === 'report' && (
        <div className="ui-card" style={{ textAlign: 'left' }}>
          <h2>Report {label}</h2>
          <label className="ui-label" htmlFor="ru-reason">What is wrong?</label>
          <select id="ru-reason" className="ui-select" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {msg && <p className="ui-err">{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className={busy ? 'ui-btn dim' : 'ui-btn'} disabled={busy} onClick={async () => { if (await call('/api/users/report', { userId, reason }, 'Thanks. We read every report.')) setDone(true) }}>Send report</button>
            <button className="ui-btn ghost" onClick={() => { setMode(''); setMsg('') }}>Cancel</button>
          </div>
        </div>
      )}
      {mode === 'block' && (
        <div className="ui-card" style={{ textAlign: 'left' }}>
          <h2>Block {label}?</h2>
          <p className="ui-note">You will not see each other's loads or profiles, and neither of you can bid on, claim or message the other. You can undo this any time under Blocked users.</p>
          {msg && <p className="ui-err">{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className={busy ? 'ui-btn dim' : 'ui-btn'} disabled={busy} onClick={async () => { if (await call('/api/blocks', { userId, action: 'block' }, 'Blocked. You will not see each other anymore.')) setDone(true) }}>Block</button>
            <button className="ui-btn ghost" onClick={() => { setMode(''); setMsg('') }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
