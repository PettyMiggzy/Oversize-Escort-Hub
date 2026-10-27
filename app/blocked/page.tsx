'use client'
import { useEffect, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'

export default function BlockedUsersPage() {
  const [rows, setRows] = useState<{ id: string; name: string }[] | null>(null)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/blocks')
    if (res.status === 401) { window.location.href = '/signin?redirect=/blocked'; return }
    const d = await res.json().catch(() => ({}))
    setRows(d.blocked || [])
  }
  useEffect(() => { load() }, [])

  async function unblock(id: string) {
    setMsg('')
    const res = await fetch('/api/blocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, action: 'unblock' }) })
    setMsg(res.ok ? 'Unblocked.' : 'Could not unblock. Try again.')
    if (res.ok) load()
  }

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 640 }}>
          <PageTitle eyebrow="Account" title="Blocked users" lead="People you blocked cannot see your loads or profile, and you cannot see theirs." />
          {msg && <p className="ui-ok" style={{ textAlign: 'center' }}>{msg}</p>}
          {rows === null ? <p className="ui-meta" style={{ textAlign: 'center' }}>Loading...</p> : rows.length === 0 ? (
            <EmptyState title="No one blocked" text="You can block someone from their profile or from a load they posted." />
          ) : rows.map((r) => (
            <div key={r.id} className="ui-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontWeight: 600 }}>{r.name}</span>
              <button className="ui-btn ghost" onClick={() => unblock(r.id)}>Unblock</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
