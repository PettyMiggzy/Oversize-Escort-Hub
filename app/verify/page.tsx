'use client'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FREE_LAUNCH } from '@/lib/free-launch'
import { isNativeApp } from '@/lib/native'

type ProfileFlags = {
  bgc_paid?: boolean
  bgc_verified?: boolean
  bgc_pending?: boolean
  pevo_paid?: boolean
  verified_tier?: number | null
}

export default function VerifyPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [flags, setFlags] = useState<ProfileFlags>({})
  const [loading, setLoading] = useState(true)

  const [bgcFile, setBgcFile] = useState<File | null>(null)
  const [bgcSubmitting, setBgcSubmitting] = useState(false)
  const [bgcSubmitted, setBgcSubmitted] = useState(false)
  const [bgcMsg, setBgcMsg] = useState('')
  const [bgcCheckoutLoading, setBgcCheckoutLoading] = useState(false)

  const [pevoFile, setPevoFile] = useState<File | null>(null)
  const [pevoCheckoutLoading, setPevoCheckoutLoading] = useState<'member'|'pro'|''>('')
  const [pevoMsg, setPevoMsg] = useState('')

  const refreshProfile = useCallback(async () => {
    const res = await fetch('/api/profile/me')
    const body = await res.json().catch(() => ({}))
    const data = res.ok ? body.profile : null
    setFlags(FREE_LAUNCH ? { ...(data || {}), bgc_paid: true, pevo_paid: true } : (data || {}))
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) { if (!cancelled) setLoading(false); return }
      if (cancelled) return
      setUserId(u.id); setEmail(u.email ?? null)
      await refreshProfile()

      // Stripe success return: verify session, then refresh.
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('session_id')
        if (params.get('bgc') === 'success' && sessionId) {
          try {
            const r = await fetch('/api/bgc/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sessionId }),
            })
            if (r.ok) await refreshProfile()
          } catch {}
          window.history.replaceState({}, '', '/verify')
        }
      }
      if (!cancelled) setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [supabase, refreshProfile])

  const startBgcCheckout = async () => {
    if (isNativeApp()) { setBgcMsg('Payments are handled on our website.'); return }
    if (!userId) { setBgcMsg('Please sign in first.'); return }
    setBgcMsg(''); setBgcCheckoutLoading(true)
    try {
      const res = await fetch('/api/bgc-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setBgcMsg(data.error || 'Checkout failed')
    } catch (e: any) { setBgcMsg(e?.message || 'Checkout failed') }
    finally { setBgcCheckoutLoading(false) }
  }

  const submitBgc = async () => {
    if (!bgcFile) { setBgcMsg('Choose your BGC PDF first.'); return }
    setBgcMsg(''); setBgcSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', bgcFile)
      const res = await fetch('/api/bgc', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setBgcMsg(data.error || 'Upload failed'); return }
      setBgcSubmitted(true)
      if (userId) await refreshProfile()
    } catch (e: any) { setBgcMsg(e?.message || 'Upload failed') }
    finally { setBgcSubmitting(false) }
  }

  const startPevoCheckout = async (tier: 'member'|'pro') => {
    if (isNativeApp()) { setPevoMsg('Payments are handled on our website.'); return }
    if (!userId || !email) { setPevoMsg('Please sign in first.'); return }
    setPevoMsg(''); setPevoCheckoutLoading(tier)
    try {
      const priceId = tier === 'pro' ? 'price_1TF0DiLmfugPCRbAPWsN2K5x' : 'price_1TF0D4LmfugPCRbAd4hMO22R'
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId, email }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setPevoMsg(data.error || 'Checkout failed')
    } catch (e: any) { setPevoMsg(e?.message || 'Checkout failed') }
    finally { setPevoCheckoutLoading('') }
  }

  const submitPevo = async (tier: 'member'|'pro') => {
    if (!pevoFile) { setPevoMsg('Choose your P/EVO cert first.'); return }
    setPevoMsg(''); setPevoCheckoutLoading(tier)
    try {
      const fd = new FormData()
      fd.append('pdf', pevoFile)
      fd.append('certType', 'pevo')
      // Default expiry 1y from now if user didn't set
      const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1)
      fd.append('expiryDate', exp.toISOString().slice(0,10))
      const res = await fetch('/api/escort/cert-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setPevoMsg(data.error || 'Upload failed'); return }
      setPevoMsg('✅ Submitted! We\u2019ll review within 24–48 hours.')
      setPevoFile(null)
    } catch (e: any) { setPevoMsg(e?.message || 'Upload failed') }
    finally { setPevoCheckoutLoading('') }
  }

  const fileStyle: React.CSSProperties = { fontSize: 16, color: '#fff', marginBottom: 12, display: 'block', maxWidth: '100%' }

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle eyebrow="Verification" title="Build trust. Get more loads." lead="Verified escorts get priority placement on the load board." />

          {!userId && !loading && (
            <div className="ui-card" style={{ marginBottom: 24 }}>
              <p className="ui-note">You must <a href="/signin?redirect=/verify" style={{ color: 'var(--ui-or)' }}>sign in</a> to verify.</p>
            </div>
          )}

          <div className="ui-grid">
            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="ui-k">Background check</div>
                <h2>BGC Badge</h2>
                <div className="ui-v or">$9.99</div>
                <div className="ui-meta">one-time</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['National background check', 'BGC badge on profile', 'Higher carrier trust', 'Priority load placement'].map(f => (
                  <li key={f} className="ui-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ui-ok" style={{ margin: 0 }}>✓</span> {f}</li>
                ))}
              </ul>

              {flags.bgc_verified ? (
                <div className="ui-card good" style={{ padding: 16, boxShadow: 'none' }}>
                  <p className="ui-ok" style={{ margin: 0, fontWeight: 700 }}>✓ Verified</p>
                  <p className="ui-note" style={{ marginTop: 6 }}>Need to re-upload? Email <a href="mailto:verify@oversize-escort-hub.com" style={{ color: 'var(--ui-or)' }}>verify@oversize-escort-hub.com</a></p>
                </div>
              ) : bgcSubmitted || flags.bgc_pending ? (
                <div className="ui-card warn" style={{ padding: 16, boxShadow: 'none' }}>
                  <p className="ui-v or" style={{ fontSize: 16, margin: 0 }}>✅ Submitted!</p>
                  <p className="ui-note" style={{ marginTop: 6 }}>We’ll review within 24–48 hours.</p>
                </div>
              ) : flags.bgc_paid ? (
                <div>
                  <label className="ui-label">Upload BGC Authorization PDF</label>
                  <input type="file" accept=".pdf" onChange={e => setBgcFile(e.target.files?.[0] ?? null)} style={fileStyle} />
                  {bgcFile && <p className="ui-meta" style={{ marginBottom: 12 }}>{bgcFile.name}</p>}
                  <button onClick={submitBgc} disabled={bgcSubmitting || !bgcFile} className={(bgcSubmitting || !bgcFile) ? 'ui-btn dim' : 'ui-btn'}>
                    {bgcSubmitting ? 'Uploading…' : 'Submit for Review'}
                  </button>
                  {bgcMsg && <p className="ui-err">{bgcMsg}</p>}
                </div>
              ) : (
                <div>
                  <p className="ui-note" style={{ marginBottom: 12 }}>Pay first to unlock the upload form.</p>
                  <button onClick={startBgcCheckout} disabled={bgcCheckoutLoading || !userId} className={(bgcCheckoutLoading || !userId) ? 'ui-btn dim' : 'ui-btn'}>
                    {bgcCheckoutLoading ? 'Redirecting…' : 'Pay $9.99 to Unlock Upload'}
                  </button>
                  {bgcMsg && <p className="ui-err">{bgcMsg}</p>}
                </div>
              )}
            </div>

            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="ui-k">Cert review</div>
                <h2>P/EVO Cert — Member</h2>
                <div className="ui-v or">$14.99</div>
                <div className="ui-meta">one-time</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Admin reviews your cert', 'Verified P/EVO badge', 'Higher carrier trust', 'Priority placement'].map(f => (
                  <li key={f} className="ui-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ui-ok" style={{ margin: 0 }}>✓</span> {f}</li>
                ))}
              </ul>
              {flags.pevo_paid ? (
                <div>
                  <label className="ui-label">Upload P/EVO Certificate (PDF or image)</label>
                  <input type="file" accept=".pdf,image/*" onChange={e => setPevoFile(e.target.files?.[0] ?? null)} style={fileStyle} />
                  {pevoFile && <p className="ui-meta" style={{ marginBottom: 12 }}>{pevoFile.name}</p>}
                  <button onClick={() => submitPevo('member')} disabled={!!pevoCheckoutLoading || !pevoFile} className={(pevoCheckoutLoading || !pevoFile) ? 'ui-btn dim' : 'ui-btn'}>
                    {pevoCheckoutLoading === 'member' ? 'Uploading…' : 'Submit for Review'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="ui-note" style={{ marginBottom: 12 }}>Pay first to unlock the upload form.</p>
                  <button onClick={() => startPevoCheckout('member')} disabled={!!pevoCheckoutLoading || !userId} className={(pevoCheckoutLoading || !userId) ? 'ui-btn dim' : 'ui-btn'}>
                    {pevoCheckoutLoading === 'member' ? 'Redirecting…' : 'Pay $14.99 to Unlock Upload'}
                  </button>
                </div>
              )}
            </div>

            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="ui-k">Cert review (Pro)</div>
                <h2>P/EVO Cert — Pro</h2>
                <div className="ui-v or">$9.99</div>
                <div className="ui-meta">Pro subscriber rate</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Discounted for Pro tier', 'Admin cert review', 'Verified P/EVO badge', 'Priority placement'].map(f => (
                  <li key={f} className="ui-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ui-ok" style={{ margin: 0 }}>✓</span> {f}</li>
                ))}
              </ul>
              {flags.pevo_paid ? (
                <div>
                  <label className="ui-label">Upload P/EVO Certificate (PDF or image)</label>
                  <input type="file" accept=".pdf,image/*" onChange={e => setPevoFile(e.target.files?.[0] ?? null)} style={fileStyle} />
                  {pevoFile && <p className="ui-meta" style={{ marginBottom: 12 }}>{pevoFile.name}</p>}
                  <button onClick={() => submitPevo('pro')} disabled={!!pevoCheckoutLoading || !pevoFile} className={(pevoCheckoutLoading || !pevoFile) ? 'ui-btn dim' : 'ui-btn'}>
                    {pevoCheckoutLoading === 'pro' ? 'Uploading…' : 'Submit for Review'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="ui-note" style={{ marginBottom: 12 }}>Pay first to unlock the upload form.</p>
                  <button onClick={() => startPevoCheckout('pro')} disabled={!!pevoCheckoutLoading || !userId} className={(pevoCheckoutLoading || !userId) ? 'ui-btn dim' : 'ui-btn'}>
                    {pevoCheckoutLoading === 'pro' ? 'Redirecting…' : 'Pay $9.99 to Unlock Upload'}
                  </button>
                </div>
              )}
            </div>

            {pevoMsg && <p className={pevoMsg.startsWith('✅') ? 'ui-ok' : 'ui-err'} style={{ gridColumn: '1 / -1' }}>{pevoMsg}</p>}

            {!isNativeApp() && (
            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="ui-k">Sponsored zone</div>
                <h2>State Sponsorship</h2>
                <div className="ui-v or">$29.99<span className="ui-meta">/30 days</span></div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['1 carrier per state', 'Top of load list', 'Sponsored badge', 'Exclusive placement'].map(f => (
                  <li key={f} className="ui-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ui-ok" style={{ margin: 0 }}>✓</span> {f}</li>
                ))}
              </ul>
              <a href="/pricing#sponsored" className="ui-btn block">Pick a Zone →</a>
            </div>
            )}

            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: 0.45, pointerEvents: 'none' }}>
              <div>
                <div className="ui-k">Veteran verification</div>
                <h2>DD-214 Veteran</h2>
                <span className="ui-badge dim">Coming Soon</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Veteran verified badge', 'Veteran Discount — Coming Soon', 'Priority support'].map(f => (
                  <li key={f} className="ui-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>○</span> {f}</li>
                ))}
              </ul>
              <button disabled className="ui-btn dim">Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
