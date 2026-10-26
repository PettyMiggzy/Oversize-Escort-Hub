'use client'
import { useEffect, useState } from 'react'
import EmptyState from '@/components/EmptyState'
import HideInApp from '@/components/HideInApp'

type Doc = { id: string; type: string | null; status: string | null; expiry_date: string | null; show_on_profile: boolean | null; reject_reason: string | null; created_at: string | null }

const TYPES: [string, string][] = [['pevo', 'P/EVO certificate'], ['insurance', 'Proof of insurance'], ['vehicle', 'Vehicle'], ['state_cert', 'Other certificate']]
const LABEL: Record<string, string> = Object.fromEntries(TYPES)
const STATUS: Record<string, string> = { pending: 'Waiting for review', approved: 'Reviewed', rejected: 'Not accepted' }

export default function Documents() {
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState('')
  const [type, setType] = useState('insurance')
  const [expiry, setExpiry] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [sending, setSending] = useState(false)

  async function load() {
    const res = await fetch('/api/escort/docs')
    if (res.status === 401) { window.location.href = '/signin?redirect=/my-documents'; return }
    const d = await res.json().catch(() => ({}))
    setDocs(Array.isArray(d.documents) ? d.documents : [])
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of this page's own list
  useEffect(() => { load().catch(() => { setErr('Could not load your documents'); setDocs([]) }) }, [])

  async function toggle(id: string, show: boolean) {
    setBusy(id); setErr(''); setOk('')
    const res = await fetch('/api/escort/docs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ certId: id, show }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) setErr(d.error || 'Could not change that')
    else setOk(show ? (d.live ? 'It now shows on your public profile.' : 'It will show on your profile once we have reviewed it.') : 'It is hidden from your public profile.')
    await load()
    setBusy('')
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !expiry) return
    setSending(true); setErr(''); setOk('')
    const fd = new FormData()
    fd.append('pdf', file); fd.append('certType', type); fd.append('expiryDate', expiry)
    try {
      const res = await fetch('/api/escort/cert-upload', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) setErr(res.status === 402 ? 'A P/EVO certificate is reviewed after you buy the review on our website. Insurance and vehicle documents can be uploaded now.' : d.error || 'Upload failed')
      else { setOk('Uploaded. We will review it and email you.'); setFile(null); setFileKey((k) => k + 1); setExpiry('') }
    } catch { setErr('Could not connect. Try again.') }
    setSending(false)
    await load()
  }

  return (
    <div className="ui-stack">
      <div className="ui-card">
        <h2>Add a document</h2>
        <p className="ui-note" style={{ marginBottom: 12 }}>A PDF or a photo (JPG, PNG or WebP), up to 10 MB. We look at every document before it counts. If you turn on &quot;show on my profile&quot;, anyone can open it, so cover your date of birth, home address, license number and policy number first.</p>
        <form onSubmit={upload} className="ui-stack">
          <div>
            <label className="ui-label" htmlFor="doc-type">What is it?</label>
            <select id="doc-type" className="ui-select" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="ui-label" htmlFor="doc-expiry">Expires on</label>
            <input id="doc-expiry" className="ui-input" type="date" required value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div>
            <label className="ui-label" htmlFor="doc-file">File</label>
            <input key={fileKey} id="doc-file" className="ui-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {err ? <p className="ui-err">{err}</p> : null}
          {ok ? <p className="ui-ok">{ok}</p> : null}
          <div><button type="submit" className="ui-btn" disabled={!file || !expiry || sending}>{sending ? 'Uploading…' : 'Upload'}</button></div>
          <HideInApp><p className="ui-note">Reviewing a P/EVO certificate is a one-time add-on. <a className="ui-link" href="/pricing">See the add-ons</a>.</p></HideInApp>
        </form>
      </div>

      <div className="ui-card">
        <h2>Your documents</h2>
        {docs === null ? <p className="ui-meta">Loading…</p> : docs.length === 0 ? (
          <EmptyState title="No documents yet" text="Upload one above. Nothing shows on your public profile unless you turn it on." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {docs.map((d) => {
              const expired = !!d.expiry_date && String(d.expiry_date).slice(0, 10) < new Date().toISOString().slice(0, 10)
              return (
                <div key={d.id} className="ui-load">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{LABEL[String(d.type)] || String(d.type || 'Document').replace(/_/g, ' ')}</p>
                    <div className="ui-chips" style={{ marginTop: 8 }}>
                      <span className={d.status === 'approved' ? 'ui-badge green' : d.status === 'rejected' ? 'ui-badge red' : 'ui-badge dim'}>{STATUS[String(d.status)] || d.status}</span>
                      {d.expiry_date ? <span className={expired ? 'ui-badge red' : 'ui-badge dim'}>{expired ? 'Expired ' : 'Valid through '}{String(d.expiry_date).slice(0, 10)}</span> : null}
                      {d.show_on_profile ? <span className="ui-badge orange">{d.status === 'approved' && !expired ? 'Shown on profile' : 'Will show when reviewed'}</span> : null}
                    </div>
                    {d.status === 'rejected' && d.reject_reason ? <p className="ui-note" style={{ marginTop: 8 }}>{d.reject_reason}</p> : null}
                  </div>
                  {d.status !== 'rejected' ? (
                    <button type="button" className="ui-btn ghost" disabled={busy === d.id} onClick={() => toggle(d.id, !d.show_on_profile)}>
                      {d.show_on_profile ? 'Hide from my profile' : 'Show on my profile'}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
