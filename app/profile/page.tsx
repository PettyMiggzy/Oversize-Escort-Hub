'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

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

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 560 }}>
          <PageTitle eyebrow="Account" title="Edit profile" lead="Update the basics carriers and escorts see on your account." />
          {loading ? (
            <p className="ui-meta">Loading…</p>
          ) : (
            <form onSubmit={save} className="ui-card ui-stack">
              <div>
                <label className="ui-label" htmlFor="full-name">Full name</label>
                <input id="full-name" className="ui-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="ui-label" htmlFor="company">Company</label>
                <input id="company" className="ui-input" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div>
                <label className="ui-label" htmlFor="phone">Phone</label>
                <input id="phone" className="ui-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="ui-label" htmlFor="home-state">Home state (2-letter)</label>
                <input id="home-state" className="ui-input" value={state} maxLength={2} onChange={(e) => setState(e.target.value)} />
              </div>
              <button type="submit" disabled={saving} className={saving ? 'ui-btn dim' : 'ui-btn'}>
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              {msg && (
                <p className={msg === 'Saved.' ? 'ui-ok' : 'ui-err'}>{msg}</p>
              )}
              <a href="/dashboard" className="ui-back">← Back to dashboard</a>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
