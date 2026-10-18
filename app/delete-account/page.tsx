'use client'
import { useEffect, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { createClient } from '@/lib/supabase/client'

// "Delete my account": the page the app stores ask for (Apple and Google both require account deletion, and Google wants a
// public link to it). Signed-out visitors are sent to sign in first.
export default function DeleteAccountPage() {
  const supabase = createClient()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function deleteAccount() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        setMsg(data.error || 'Something went wrong. Nothing was deleted.')
        setBusy(false)
        return
      }
      await supabase.auth.signOut().catch(() => {})
      setDone(true)
    } catch {
      setMsg('Could not reach the server. Nothing was deleted.')
    }
    setBusy(false)
  }

  const box: React.CSSProperties = { maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }
  const card: React.CSSProperties = { background: '#111', border: '1px solid #222', borderRadius: 10, padding: 24 }
  const btn: React.CSSProperties = { background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ccc', fontFamily: 'system-ui, sans-serif' }}>
      <SiteHeader />
      <div style={box}>
        <div style={{ fontSize: 10, letterSpacing: '.2em', color: '#f90', marginBottom: 10 }}>ACCOUNT</div>
        <h1 style={{ fontSize: 30, color: '#fff', marginBottom: 16, fontWeight: 700 }}>Delete my account</h1>

        {done ? (
          <div style={card}>
            <p style={{ color: '#fff', marginBottom: 8 }}>Your account has been deleted.</p>
            <p style={{ fontSize: 14 }}>Your subscription is cancelled and your personal details are removed. <a href="/" style={{ color: '#f90' }}>Back to the home page</a></p>
          </div>
        ) : signedIn === null ? (
          <p>Loading…</p>
        ) : !signedIn ? (
          <div style={card}>
            <p style={{ marginBottom: 12 }}>Sign in to the account you want to delete.</p>
            <a href="/signin?redirect=/delete-account" style={{ ...btn, background: '#f0a500', color: '#000', textDecoration: 'none', display: 'inline-block' }}>Sign in</a>
            <p style={{ fontSize: 13, marginTop: 16, color: '#888' }}>Can&apos;t sign in? Email <a href="mailto:support@oversize-escort-hub.com" style={{ color: '#f90' }}>support@oversize-escort-hub.com</a> from the address on the account and we will delete it for you.</p>
          </div>
        ) : (
          <div style={card}>
            <p style={{ marginBottom: 12 }}>This permanently deletes your account. It cannot be undone.</p>
            <ul style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16, paddingLeft: 20 }}>
              <li>Your subscription is cancelled right away. No refund is given for the current period.</li>
              <li>Your name, email, phone, photo, documents, availability, expenses and job logs are removed.</li>
              <li>Your open loads are closed and your pending bids withdrawn.</li>
              <li>Invoices and reviews other people rely on stay, shown as &quot;Deleted user&quot;.</li>
            </ul>
            <label style={{ display: 'block', fontSize: 12, color: '#999', marginBottom: 6 }}>Type DELETE to confirm</label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              style={{ width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: 6, padding: '10px 12px', marginBottom: 16 }}
            />
            <button onClick={deleteAccount} disabled={busy || confirmText !== 'DELETE'} style={{ ...btn, opacity: busy || confirmText !== 'DELETE' ? 0.5 : 1 }}>
              {busy ? 'Deleting…' : 'Delete my account'}
            </button>
            {msg && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 14 }}>{msg}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
