'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SiteHeader from '@/components/SiteHeader'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/signin')
        return
      }
      const res = await fetch('/api/profile/me')
      const body = await res.json().catch(() => ({}))
      const prof = res.ok ? body.profile : null
      if (prof) {
        setFullName(prof.full_name || '')
        setCompany(prof.company_name || '')
        setPhone(prof.phone || '')
        setState(prof.state || '')
      }
      setLoading(false)
    })()
  }, [router, supabase])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMsg('Please sign in.')
      setSaving(false)
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim().slice(0, 120) || null,
        company_name: company.trim().slice(0, 120) || null,
        phone: phone.trim().slice(0, 40) || null,
        state: state.trim().toUpperCase().slice(0, 2) || null,
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setMsg('Saved.')
  }

  const inp: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#0f1a2e',
    border: '1px solid #1e3a5f',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 14,
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0' }}>
      <SiteHeader />
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Edit Profile</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
          Update the basics carriers and escorts see on your account.
        </p>
        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading…</p>
        ) : (
          <form onSubmit={save} style={{ display: 'grid', gap: 14 }}>
            <label style={{ fontSize: 12, color: '#9ca3af' }}>
              Full name
              <input style={{ ...inp, marginTop: 6 }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, color: '#9ca3af' }}>
              Company
              <input style={{ ...inp, marginTop: 6 }} value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, color: '#9ca3af' }}>
              Phone
              <input style={{ ...inp, marginTop: 6 }} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, color: '#9ca3af' }}>
              Home state (2-letter)
              <input style={{ ...inp, marginTop: 6 }} value={state} maxLength={2} onChange={(e) => setState(e.target.value)} />
            </label>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#f60',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '12px 20px',
                fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            {msg && (
              <p style={{ fontSize: 13, color: msg === 'Saved.' ? '#22c55e' : '#ef4444' }}>{msg}</p>
            )}
            <a href="/dashboard" style={{ color: '#9ca3af', fontSize: 13 }}>← Back to dashboard</a>
          </form>
        )}
      </main>
    </div>
  )
}
