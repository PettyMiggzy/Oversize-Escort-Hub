'use client'
import { useEffect, useState } from 'react'
import { EQUIPMENT } from '@/lib/quality'

/** A pilot car lists the equipment on their own rig. Shown on their profile as "listed by the escort, not checked by us". */
export default function EquipmentEditor() {
  const [have, setHave] = useState<string[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let off = false
    fetch('/api/equipment').then((r) => r.json()).then((d) => { if (!off && d?.ok) { setHave(Array.isArray(d.equipment) ? d.equipment : []); setCanEdit(!!d.canEdit) } }).catch(() => {})
    return () => { off = true }
  }, [])
  if (!canEdit) return null
  const toggle = (k: string) => { setMsg(''); setHave((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k])) }
  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ equipment: have }) })
    const d = await res.json().catch(() => ({} as { error?: string }))
    setSaving(false)
    setMsg(res.ok ? 'Saved.' : d.error || 'Could not save.')
  }
  return (
    <div className="ui-card ui-stack" style={{ marginTop: 16 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, color: '#fff' }}>My equipment</h2>
        <p className="ui-note" style={{ margin: 0 }}>Tick what is on your vehicle. Carriers see it on your profile as listed by you, not checked by us. Some loads ask for equipment, and you confirm you have it when you claim.</p>
      </div>
      <div className="ui-chips">
        {EQUIPMENT.map((q) => (
          <label key={q.key} className={have.includes(q.key) ? 'ui-chip on' : 'ui-chip'}>
            <input type="checkbox" checked={have.includes(q.key)} onChange={() => toggle(q.key)} style={{ accentColor: 'var(--ui-or)' }} />
            {q.label}
          </label>
        ))}
      </div>
      <button type="button" onClick={save} disabled={saving} className={saving ? 'ui-btn dim' : 'ui-btn'}>{saving ? 'Saving…' : 'Save equipment'}</button>
      {msg && <p className={msg === 'Saved.' ? 'ui-ok' : 'ui-err'}>{msg}</p>}
    </div>
  )
}
