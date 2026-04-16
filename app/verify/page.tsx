'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const BGC_PRICE_ID = 'price_1TF0EILmfugPCRbAvM6Q5rhW'

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setEmail(data.user?.email ?? null)
    })
  }, [])

  const handleBGCCheckout = async () => {
    if (!file) { setMsg('Please upload your BGC PDF first.'); return }
    if (!userId || !email) { setMsg('Please sign in first.'); return }
    setLoading(true)
    try {
      // Upload PDF to Supabase storage
      const ext = file.name.split('.').pop()
      const path = `bgc/${userId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('bgc-docs').upload(path, file)
      if (uploadErr) { setMsg('Upload failed: ' + uploadErr.message); setLoading(false); return }

      // Create Stripe checkout for BGC badge
      const res = await fetch('/api/bgc-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMsg('Checkout error: ' + (data.error ?? 'Unknown'))
        setLoading(false)
      }
    } catch (e: any) {
      setMsg('Error: ' + e.message)
      setLoading(false)
    }
  }

  const card: React.CSSProperties = {
    background: '#111', border: '1px solid #1e3a5f', borderRadius: 12,
    padding: 32, display: 'flex', flexDirection: 'column', gap: 16,
  }
  const cardDisabled: React.CSSProperties = {
    ...card, opacity: 0.45, pointerEvents: 'none', filter: 'grayscale(0.5)',
  }
  const btn: React.CSSProperties = {
    background: '#ff6600', color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'sans-serif', padding: '60px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <p style={{ color: '#ff6600', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          OEH VERIFICATION
        </p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
          Build Trust. Get More Loads.
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: 40 }}>
          Verified escorts get priority placement on the load board.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* BGC Badge */}
          <div style={card}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                BACKGROUND CHECK
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>BGC Badge</h2>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#ff6600' }}>$9.99</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>one-time</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['National background check', 'BGC badge on profile', 'Higher carrier trust', 'Priority load placement'].map(f => (
                <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#22c55e' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
                Upload BGC Authorization PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: 13, color: '#fff', marginBottom: 12, display: 'block' }}
              />
              {file && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{file.name}</p>}
              <button onClick={handleBGCCheckout} disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Processing...' : 'Get BGC Badge — $9.99'}
              </button>
              {msg && <p style={{ fontSize: 13, color: '#f87171', marginTop: 10 }}>{msg}</p>}
            </div>
          </div>

          {/* DD-214 Veteran — coming soon */}
          <div style={cardDisabled}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                VETERAN VERIFICATION
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>DD-214 Veteran</h2>
              <div style={{ display: 'inline-block', background: '#374151', color: '#9ca3af', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginTop: 4 }}>
                Coming Soon
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Veteran verified badge', 'Veteran Discount — Coming Soon', 'Priority support'].map(f => (
                <li key={f} style={{ fontSize: 14, color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#6b7280' }}>○</span> {f}
                </li>
              ))}
            </ul>
            <button disabled style={{ ...btn, background: '#374151', color: '#6b7280', cursor: 'not-allowed' }}>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
