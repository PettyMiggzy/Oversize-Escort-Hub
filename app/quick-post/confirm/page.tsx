'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import { createClient } from '@/lib/supabase/client'

type Done = { loadId: string; newAccount: boolean; email: string }

function Confirm() {
  const t = useSearchParams().get('t') || ''
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const [pw, setPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  async function go() {
    setErr(''); setBusy(true)
    try {
      const res = await fetch('/api/quick-post/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(d.error || 'Something went wrong.'); return }
      setDone(d)
    } catch { setErr('Could not reach the server. Try again.') } finally { setBusy(false) }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!done) return
    setPwMsg('Saving…')
    const res = await fetch('/api/quick-post/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t, password: pw }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setPwMsg(d.error || 'Could not save the password.'); return }
    const { error } = await createClient().auth.signInWithPassword({ email: done.email, password: pw })
    if (error) { setPwMsg('Password saved. Sign in with it on the next page.'); window.location.href = '/signin'; return }
    window.location.href = '/dashboard'
  }

  return (
    <div className="ui-page"><div className="ui-wrap" style={{ maxWidth: 560 }}>
      {!done ? (
        <div className="ui-empty">
          <h3>Post your load</h3>
          <p>{t ? 'One tap and your load goes on the board for 24 hours.' : 'This link is not valid. Post your load again to get a new one.'}</p>
          {err && <p className="ui-err">{err}</p>}
          {t ? <button className={busy ? 'ui-btn dim' : 'ui-btn'} disabled={busy} onClick={go}>{busy ? 'Posting…' : 'Confirm and post my load'}</button> : <a className="ui-btn" href="/quick-post">Post a load</a>}
        </div>
      ) : (
        <div className="ui-card ui-stack">
          <h2 style={{ fontSize: 26, margin: 0 }}>Your load is live</h2>
          <p className="ui-note">Escorts can see it now and we are alerting the ones who cover those states. It stays up for 24 hours.</p>
          {done.newAccount ? (
            <form onSubmit={savePassword} className="ui-stack">
              <p className="ui-note">We made you a free account with <strong style={{ color: '#fff' }}>{done.email}</strong>. Pick a password to see bids and accept an escort.</p>
              <div><label className="ui-label" htmlFor="qp-pw">New password (8 or more characters)</label><input id="qp-pw" type="password" className="ui-input" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required /></div>
              {pwMsg && <p className="ui-note">{pwMsg}</p>}
              <button className="ui-btn block" type="submit">Save password and open my dashboard</button>
            </form>
          ) : (
            <a href="/dashboard" className="ui-btn">Go to my dashboard</a>
          )}
          <a href="/open-loads" className="ui-link">See the boards</a>
        </div>
      )}
    </div></div>
  )
}

export default function QuickPostConfirmPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}><Confirm /></Suspense>
    </>
  )
}
