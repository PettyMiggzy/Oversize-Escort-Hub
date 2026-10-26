'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function ApplyBox({ jobId, posterId }: { jobId: string; posterId: string }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  if (userId === undefined) {
    return <div className="ui-card"><p className="ui-meta">Checking sign-in…</p></div>
  }

  if (userId && userId === posterId) {
    return (
      <div className="ui-card">
        <h2>This is your job</h2>
        <p className="ui-note">Applicants show up on your dashboard.</p>
        <div style={{ marginTop: 14 }}>
          <Link href="/dashboard" className="ui-btn">Dashboard</Link>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="ui-card">
        <h2>Apply</h2>
        <p className="ui-note">Sign in to send a short message. Contact details are shared after they accept you.</p>
        <div style={{ marginTop: 14 }}>
          <Link href="/signin" className="ui-btn">Sign in to apply</Link>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not send your application')
        return
      }
      setDone(true)
    } catch {
      setError('Could not send your application')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="ui-card">
      <h2>Apply</h2>
      {done ? (
        <p className="ui-note">Application sent. Contact details are shared after they accept you.</p>
      ) : (
        <form onSubmit={submit}>
          <label className="ui-label" htmlFor="apply-message">Message</label>
          <textarea
            id="apply-message"
            className="ui-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="A short note about your experience"
          />
          <p className="ui-note" style={{ marginTop: 8 }}>Do not put phone numbers or links in this message. Contact details are shared after they accept you.</p>
          {error ? (
            <div role="alert" style={{ marginTop: 12, border: '1px solid rgba(255,90,90,.55)', background: 'rgba(255,90,90,.08)', borderRadius: 12, padding: 12, color: '#ff8a8a' }}>
              {error}
            </div>
          ) : null}
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="ui-btn" disabled={sending}>{sending ? 'Sending…' : 'Apply'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
