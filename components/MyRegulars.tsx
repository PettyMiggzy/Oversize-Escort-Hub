'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cleanEquipment, equipmentShort } from '@/lib/quality'

type Regular = { escort_id: string; name: string; rating: number | null; reviews: number; equipment: string[] }

/** The pilot cars a carrier keeps as regulars: first look at their loads, and the backup list when someone cancels. */
export default function MyRegulars() {
  const [list, setList] = useState<Regular[] | null>(null)
  useEffect(() => {
    let off = false
    fetch('/api/regulars').then((r) => r.json()).then((d) => { if (!off) setList(Array.isArray(d?.regulars) ? d.regulars : []) }).catch(() => { if (!off) setList([]) })
    return () => { off = true }
  }, [])
  async function remove(id: string) {
    setList((prev) => (prev || []).filter((r) => r.escort_id !== id))
    await fetch('/api/regulars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escort_id: id, on: false }) }).catch(() => {})
  }
  if (list === null) return null
  return (
    <section>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>My regulars ({list.length})</h2>
      <p className="ui-note" style={{ marginBottom: 12 }}>Pilot cars you like to call first. When you post a load you can give them first look for a few minutes, and they are your backup when someone cancels.</p>
      {list.length === 0 ? (
        <div className="ui-card"><p className="ui-note" style={{ margin: 0 }}>No regulars yet. Open <Link href="/find-escorts" style={{ color: 'var(--ui-or)' }}>Find Escorts</Link> and tap Add to my regulars on the ones you trust.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((r) => (
            <div key={r.escort_id} className="ui-load" style={{ gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/escorts/${r.escort_id}`} className="ui-route" style={{ textDecoration: 'none' }}>{r.name}</Link>
                  <div className="ui-meta" style={{ marginTop: 4 }}>
                    {r.rating ? <span style={{ color: '#ffc46b', fontWeight: 600 }}>&#9733; {Number(r.rating).toFixed(1)} ({r.reviews}) </span> : null}
                    {cleanEquipment(r.equipment).slice(0, 4).map(equipmentShort).join(', ')}
                  </div>
                </div>
                <button type="button" onClick={() => remove(r.escort_id)} className="ui-btn ghost" style={{ minHeight: 36, padding: '6px 14px', fontSize: 13 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
