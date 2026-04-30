'use client'
import SiteHeader from '@/components/SiteHeader'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  const refreshProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('bgc_paid, bgc_verified, bgc_pending, pevo_paid, verified_tier')
      .eq('id', uid)
      .single()
    setFlags(data || {})
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) { if (!cancelled) setLoading(false); return }
      if (cancelled) return
      setUserId(u.id); setEmail(u.email ?? null)
      await refreshProfile(u.id)

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
            if (r.ok) await refreshProfile(u.id)
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
      if (userId) await refreshProfile(userId)
    } catch (e: any) { setBgcMsg(e?.message || 'Upload failed') }
    finally { setBgcSubmitting(false) }
  }

  const startPevoCheckout = async (tier: 'member'|'pro') => {
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

  const card: React.CSSProperties = { background: '#111', border: '1px solid #1e3a5f', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }
  const cardDisabled: React.CSSProperties = { ...card, opacity: 0.45, pointerEvents: 'none', filter: 'grayscale(0.5)' }
  const btn: React.CSSProperties = { background: '#ff6600', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }
  const btnGhost: React.CSSProperties = { background: 'transparent', color: '#ff6600', border: '1px solid #ff6600', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'sans-serif', padding: '60px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ color: '#ff6600', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>OEH VERIFICATION</p>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>Build Trust. Get More Loads.</h1>
          <p style={{ color: '#9ca3af', marginBottom: 40 }}>Verified escorts get priority placement on the load board.</p>

          {!userId && !loading && (
            <div style={{ ...card, marginBottom: 32 }}>
              <p style={{ margin: 0 }}>You must <a href="/signin?redirect=/verify" style={{ color: '#ff6600' }}>sign in</a> to verify.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* BGC Badge */}
            <div style={card}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>BACKGROUND CHECK</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>BGC Badge</h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#ff6600' }}>$9.99</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>one-time</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['National background check', 'BGC badge on profile', 'Higher carrier trust', 'Priority load placement'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#22c55e' }}>✓</span> {f}</li>
                ))}
              </ul>

              {/* State machine */}
              {flags.bgc_verified ? (
                <div style={{ background: '#0a2818', border: '1px solid #22c55e', borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#22c55e' }}>✓ Verified</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>Need to re-upload? Email <a href="mailto:verify@oversize-escort-hub.com" style={{ color: '#ff6600' }}>verify@oversize-escort-hub.com</a></p>
                </div>
              ) : bgcSubmitted || flags.bgc_pending ? (
                <div style={{ background: '#1a1407', border: '1px solid #ff6600', borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#ff6600' }}>✅ Submitted!</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#d1d5db' }}>We’ll review within 24–48 hours.</p>
                </div>
              ) : flags.bgc_paid ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Upload BGC Authorization PDF</label>
                  <input type="file" accept=".pdf" onChange={e => setBgcFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: '#fff', marginBottom: 12, display: 'block' }} />
                  {bgcFile && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{bgcFile.name}</p>}
                  <button onClick={submitBgc} disabled={bgcSubmitting || !bgcFile} style={{ ...btn, opacity: (bgcSubmitting || !bgcFile) ? 0.6 : 1 }}>
                    {bgcSubmitting ? 'Uploading…' : 'Submit for Review'}
                  </button>
                  {bgcMsg && <p style={{ fontSize: 13, color: '#f87171', marginTop: 10 }}>{bgcMsg}</p>}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>Pay first to unlock the upload form.</p>
                  <button onClick={startBgcCheckout} disabled={bgcCheckoutLoading || !userId} style={{ ...btn, opacity: (bgcCheckoutLoading || !userId) ? 0.6 : 1 }}>
                    {bgcCheckoutLoading ? 'Redirecting…' : 'Pay $9.99 to Unlock Upload'}
                  </button>
                  {bgcMsg && <p style={{ fontSize: 13, color: '#f87171', marginTop: 10 }}>{bgcMsg}</p>}
                </div>
              )}
            </div>

            {/* P/EVO Member */}
            <div style={card}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>CERT REVIEW</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>P/EVO Cert — Member</h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#ff6600' }}>$14.99</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>one-time</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Admin reviews your cert', 'Verified P/EVO badge', 'Higher carrier trust', 'Priority placement'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#22c55e' }}>✓</span> {f}</li>
                ))}
              </ul>
              {flags.pevo_paid ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Upload P/EVO Certificate (PDF or image)</label>
                  <input type="file" accept=".pdf,image/*" onChange={e => setPevoFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: '#fff', marginBottom: 12, display: 'block' }} />
                  {pevoFile && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{pevoFile.name}</p>}
                  <button onClick={() => submitPevo('member')} disabled={!!pevoCheckoutLoading || !pevoFile} style={{ ...btn, opacity: (pevoCheckoutLoading || !pevoFile) ? 0.6 : 1 }}>
                    {pevoCheckoutLoading === 'member' ? 'Uploading…' : 'Submit for Review'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>Pay first to unlock the upload form.</p>
                  <button onClick={() => startPevoCheckout('member')} disabled={!!pevoCheckoutLoading || !userId} style={{ ...btn, opacity: (pevoCheckoutLoading || !userId) ? 0.6 : 1 }}>
                    {pevoCheckoutLoading === 'member' ? 'Redirecting…' : 'Pay $14.99 to Unlock Upload'}
                  </button>
                </div>
              )}
            </div>

            {/* P/EVO Pro */}
            <div style={card}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>CERT REVIEW (PRO)</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>P/EVO Cert — Pro</h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#ff6600' }}>$9.99</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Pro subscriber rate</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Discounted for Pro tier', 'Admin cert review', 'Verified P/EVO badge', 'Priority placement'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#22c55e' }}>✓</span> {f}</li>
                ))}
              </ul>
              {flags.pevo_paid ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Upload P/EVO Certificate (PDF or image)</label>
                  <input type="file" accept=".pdf,image/*" onChange={e => setPevoFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: '#fff', marginBottom: 12, display: 'block' }} />
                  {pevoFile && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{pevoFile.name}</p>}
                  <button onClick={() => submitPevo('pro')} disabled={!!pevoCheckoutLoading || !pevoFile} style={{ ...btn, opacity: (pevoCheckoutLoading || !pevoFile) ? 0.6 : 1 }}>
                    {pevoCheckoutLoading === 'pro' ? 'Uploading…' : 'Submit for Review'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>Pay first to unlock the upload form.</p>
                  <button onClick={() => startPevoCheckout('pro')} disabled={!!pevoCheckoutLoading || !userId} style={{ ...btn, opacity: (pevoCheckoutLoading || !userId) ? 0.6 : 1 }}>
                    {pevoCheckoutLoading === 'pro' ? 'Redirecting…' : 'Pay $9.99 to Unlock Upload'}
                  </button>
                </div>
              )}
            </div>

            {pevoMsg && <p style={{ fontSize: 13, color: pevoMsg.startsWith('✅') ? '#22c55e' : '#f87171', gridColumn: '1 / -1' }}>{pevoMsg}</p>}

            {/* Sponsored */}
            <div style={card}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>SPONSORED ZONE</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>State Sponsorship</h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#ff6600' }}>$29.99<span style={{ fontSize: 14, color: '#9ca3af' }}>/mo</span></div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['1 carrier per state', 'Top of load list', 'Sponsored badge', 'Exclusive placement'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#22c55e' }}>✓</span> {f}</li>
                ))}
              </ul>
              <a href="/pricing#sponsored" style={{ ...btn, textAlign: 'center', textDecoration: 'none', display: 'block' }}>Pick a Zone →</a>
            </div>

            {/* DD-214 coming soon */}
            <div style={cardDisabled}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>VETERAN VERIFICATION</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>DD-214 Veteran</h2>
                <div style={{ display: 'inline-block', background: '#374151', color: '#9ca3af', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginTop: 4 }}>Coming Soon</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Veteran verified badge', 'Veteran Discount — Coming Soon', 'Priority support'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#6b7280' }}>○</span> {f}</li>
                ))}
              </ul>
              <button disabled style={{ ...btn, background: '#374151', color: '#6b7280', cursor: 'not-allowed' }}>Coming Soon</button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
