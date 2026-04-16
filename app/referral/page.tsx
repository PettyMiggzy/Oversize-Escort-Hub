'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export default function ReferralPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const referralLink = userId
    ? `oversize-escort-hub.com/join?ref=${userId}`
    : 'oversize-escort-hub.com/join?ref=...'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff' }}>
      <Header />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 12, padding: '24px 32px', marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f60', marginBottom: 8 }}>Referral Rewards — Coming Soon</h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Earn rewards when people you refer sign up.</p>
        </div>

        <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: 32, opacity: 0.65 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>Your Referral Link</h2>
          <div style={{ background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 6, padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: '#4a5568', marginBottom: 16, wordBreak: 'break-all' }}>
            {referralLink}
          </div>
          <button disabled style={{ background: '#1e3a5f', color: '#4a5568', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'not-allowed', fontSize: 13, marginRight: 8 }}>
            Copy Link
          </button>
          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 20, lineHeight: 1.6 }}>
            Refer a P/EVO or Carrier and earn rewards when they sign up. Details coming soon.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
