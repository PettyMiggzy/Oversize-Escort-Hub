'use client'
import { useCallback, useEffect, useState } from 'react'

type Row = {
  id: string; pu_city: string; pu_state: string; dl_city: string; dl_state: string; escort_type: string | null; escort_count?: number | null
  per_mile_rate: number | null; status: string; created_at: string; notes?: string | null
  poster: { email: string | null; name: string | null; company: string | null; since: string | null; suspended: boolean }
  reports: { reason: string; created_at: string }[]
}

const box = { background: '#111', border: '1px solid #222', borderRadius: 8, padding: 14, marginBottom: 12 } as const
const btn = (color: string) => ({ background: 'transparent', color, border: `1px solid ${color}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }) as const

function Card({ r, act }: { r: Row; act: (id: string, a: 'ok' | 'remove' | 'ban') => void }) {
  const age = r.poster.since ? Math.max(0, Math.round((Date.now() - new Date(r.poster.since).getTime()) / 86400000)) : null
  return (
    <div style={box}>
      <div style={{ fontWeight: 700, color: '#fff' }}>{r.pu_city}, {r.pu_state} → {r.dl_city}, {r.dl_state}
        <span style={{ marginLeft: 8, fontSize: 11, color: r.status === 'open' ? '#35d489' : '#9ca3af' }}>{r.status.toUpperCase()}</span></div>
      <div style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0' }}>{r.escort_count ?? 1} × {r.escort_type} · ${r.per_mile_rate}/mi · {new Date(r.created_at).toLocaleString()}</div>
      <div style={{ fontSize: 13, color: '#cbd5e1' }}>{r.poster.name || 'No name'}{r.poster.company ? ` (${r.poster.company})` : ''} · {r.poster.email}{age !== null ? ` · account ${age} day${age === 1 ? '' : 's'} old` : ''}{r.poster.suspended ? ' · SUSPENDED' : ''}</div>
      {r.notes ? <div style={{ fontSize: 13, color: '#9ca3af', margin: '6px 0' }}>Notes: {r.notes}</div> : null}
      {r.reports.length > 0 && <div style={{ fontSize: 13, color: '#ffc46b', margin: '6px 0' }}>{r.reports.length} report{r.reports.length === 1 ? '' : 's'}: {r.reports.map((x) => x.reason).join(', ')}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <button style={btn('#35d489')} onClick={() => act(r.id, 'ok')}>Looks fine</button>
        <button style={btn('#ffc46b')} onClick={() => act(r.id, 'remove')}>Remove load</button>
        <button style={btn('#ff5a5a')} onClick={() => { if (confirm('Suspend this account and take down all its open loads?')) act(r.id, 'ban') }}>Remove and suspend poster</button>
      </div>
    </div>
  )
}

export default function QuickPostReview() {
  const [data, setData] = useState<{ quickPosts: Row[]; reported: Row[] } | null>(null)
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const res = await fetch('/api/admin/quick-posts')
    if (!res.ok) { setMsg('Could not load. Are you signed in as an admin?'); return }
    setData(await res.json())
  }, [])
  useEffect(() => { load() }, [load])
  const act = async (loadId: string, action: 'ok' | 'remove' | 'ban') => {
    const res = await fetch('/api/admin/quick-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loadId, action }) })
    setMsg(res.ok ? 'Done.' : 'That did not work.')
    load()
  }
  if (!data) return <p style={{ color: '#9ca3af' }}>{msg || 'Loading…'}</p>
  return (
    <div>
      {msg && <p style={{ color: '#9ca3af', fontSize: 13 }}>{msg}</p>}
      <h3 style={{ color: '#fff', fontSize: 16, margin: '0 0 10px' }}>Reported loads ({data.reported.length})</h3>
      {data.reported.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No reports.</p>}
      {data.reported.map((r) => <Card key={r.id} r={r} act={act} />)}
      <h3 style={{ color: '#fff', fontSize: 16, margin: '20px 0 10px' }}>Posted without an account, not checked yet ({data.quickPosts.length})</h3>
      {data.quickPosts.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>Nothing waiting.</p>}
      {data.quickPosts.map((r) => <Card key={r.id} r={r} act={act} />)}
    </div>
  )
}
