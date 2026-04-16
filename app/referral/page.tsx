'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReferralPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const referralLink = userId
    ? `oversize-escort-hub.com/join?ref=${userId}`
    : 'oversize-escort-hub.com/join?ref=...'

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060b16', color: '#dce0e6' }}>
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>
        {/* Coming Soon Banner */}
        <div style={{ background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 12, padding: '24px 32px', marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0a500', marginBottom: 8 }}>Referral Rewards — Coming Soon</h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Earn rewards when people you refer sign up.</p>
        </div>

        {/* Referral Link */}
        <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: 32, opacity: userId ? 1 : 0.65 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>Your Referral Link</h2>
          <div style={{ background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 6, padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, marginBottom: 16, wordBreak: 'break-all', color: '#dce0e6' }}>
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            disabled={!userId}
            style={{
              background: copied ? '#15803d' : '#f0a500',
              color: copied ? '#fff' : '#000',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              cursor: userId ? 'pointer' : 'not-allowed',
              fontSize: 13,
              transition: 'background 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 20, lineHeight: 1.6 }}>
            {userId ? 'Share this link with P/EVO or Carrier contacts to earn rewards.' : 'Sign in to get your unique referral link.'}
          </p>
        </div>
      </main>
    </div>
  )
}
