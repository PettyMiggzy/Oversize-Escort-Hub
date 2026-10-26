'use client'
import { useState } from 'react'

const WORDS: Record<string, string> = { open: 'It is on the board now.', cancelled: 'It is off the board.', expired: 'It has expired.', filled: 'It is already filled.', pending_match: 'An escort has a request in on it.' }

export default function CheckinButtons({ loadId, token, status }: { loadId: string; token: string; status: string }) {
  const [now, setNow] = useState(status)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function go(action: 'keep' | 'close') {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch('/api/loads/checkin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ loadId, token, action }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) setErr(d.error || 'Something went wrong. Try again.')
      else { setNow(d.status); setMsg(action === 'keep' ? 'Done. It is on the board for 24 more hours.' : 'Done. It is off the board.') }
    } catch { setErr('Could not connect. Try again.') }
    setBusy(false)
  }

  return (
    <div className="ui-card">
      <p style={{ margin: '0 0 14px', lineHeight: 1.6 }}>{WORDS[now] || ''}</p>
      {msg && <p className="ui-ok">{msg}</p>}
      {err && <p className="ui-err">{err}</p>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="ui-btn" disabled={busy || now === 'filled' || now === 'pending_match'} onClick={() => go('keep')}>Keep it up (24 more hours)</button>
        <button type="button" className="ui-btn ghost" disabled={busy || now === 'filled' || now === 'pending_match'} onClick={() => go('close')}>Take it down, it is covered</button>
      </div>
    </div>
  )
}
