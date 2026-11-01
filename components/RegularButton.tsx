'use client'
import { useState } from 'react'

/** Star or unstar a pilot car as one of your regulars (carriers, brokers and fleet managers). */
export default function RegularButton({ escortId, on, onChange, compact }: { escortId: string; on: boolean; onChange?: (on: boolean) => void; compact?: boolean }) {
  const [state, setState] = useState(on)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (busy) return
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/regulars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escort_id: escortId, on: !state }) })
      const d = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) { setMsg(d.error || 'Could not do that'); return }
      setState(!state); onChange?.(!state)
    } finally { setBusy(false) }
  }
  return (
    <div>
      <button type="button" onClick={toggle} disabled={busy} className={state ? 'ui-btn ok block' : 'ui-btn ghost block'} style={compact ? { minHeight: 38, padding: '8px 14px', fontSize: 13 } : undefined} aria-pressed={state}>
        {state ? '★ In my regulars' : '☆ Add to my regulars'}
      </button>
      {msg && <div className="ui-meta" style={{ color: '#ff8a8a', marginTop: 4 }}>{msg}</div>}
    </div>
  )
}
