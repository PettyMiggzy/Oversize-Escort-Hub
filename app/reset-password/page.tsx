'use client'
import { useEffect, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user)) }, [supabase])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 8) { setMsg('Use at least 8 characters.'); return }
    setBusy(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) { setMsg(error.message || 'Could not save the password.'); return }
    window.location.href = '/dashboard'
  }

  return (
    <>
      <SiteHeader />
      <div className="ui-page"><div className="ui-wrap" style={{ maxWidth: 480 }}>
        {signedIn === false ? (
          <div className="ui-empty"><h3>This reset link has expired</h3><p>Go to the sign-in page and tap Forgot password to get a new one.</p><a className="ui-btn" href="/signin">Back to sign in</a></div>
        ) : (
          <form onSubmit={save} className="ui-card ui-stack">
            <h2 style={{ fontSize: 26, margin: 0 }}>Choose a new password</h2>
            <div><label className="ui-label" htmlFor="rp">New password (8 or more characters)</label><input id="rp" type="password" className="ui-input" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required /></div>
            {msg && <p className="ui-err">{msg}</p>}
            <button className={busy ? 'ui-btn block dim' : 'ui-btn block'} disabled={busy || signedIn === null} type="submit">Save password</button>
          </form>
        )}
      </div></div>
    </>
  )
}
