import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Verify Your Escort Certifications | OEH' }

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { tier?: string; verified_tier?: number } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('tier, verified_tier')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const paidTiers = ['member', 'pro', 'fleet_starter', 'fleet_plus', 'fleet_pro']
  const isPaid = profile?.tier && paidTiers.includes(profile.tier)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #222', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#f0a500', fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>OEH</a>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ color: '#888', fontSize: 14 }}>Verification</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {user ? (
            <a href="/dashboard" style={{ color: '#f0a500', fontSize: 13, textDecoration: 'none' }}>Dashboard →</a>
          ) : (
            <a href="/signin?redirect=verification" style={{ background: '#f0a500', color: '#000', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Sign In</a>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Escort Certification Verification</h1>
        <p style={{ color: '#888', fontSize: 15, marginBottom: 48, lineHeight: 1.6 }}>
          Verify P/EVO, WITPAC, Flagger, and Traffic Control Supervisor certifications through the Evergreen Safety Council's official tool.
        </p>

        {/* ESC Verification Tool — always public */}
        <div style={{ background: '#111', border: '1px solid #222', borderLeft: '3px solid #4ade80', borderRadius: 12, padding: 32, marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#4ade80' }}>ESC Certification Lookup</h2>
          <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Use the Evergreen Safety Council's official verification tool to confirm any escort certification.
            Covers P/EVO, WITPAC, Flagger, and Traffic Control Supervisor (TCS) certs across all states.
          </p>
          <a
            href="https://www.esc.org/resources/certification-verification"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', background: '#4ade80', color: '#000', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 8, textDecoration: 'none' }}
          >
            Open ESC Verification Tool →
          </a>
          <p style={{ color: '#555', fontSize: 12, marginTop: 12 }}>esc.org/resources/certification-verification</p>
        </div>

        {/* What certs can be verified */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Certifications Covered</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { name: 'P/EVO Certification', desc: 'Pilot/Escort Vehicle Operator', color: '#f0a500' },
              { name: 'WITPAC', desc: 'Western Interstate Corridor', color: '#f0a500' },
              { name: 'Flagger Certification', desc: 'Valid 3 years · WA/OR/ID/MT', color: '#f0a500' },
              { name: 'Traffic Control Supervisor', desc: 'TCS — WA, OR, ID state certs', color: '#f0a500' },
            ].map(cert => (
              <div key={cert.name} style={{ background: '#0a0a0a', border: `1px solid #222`, borderLeft: `3px solid ${cert.color}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{cert.name}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{cert.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OSEH2026 promo — gated to paid tiers */}
        {isPaid ? (
          <div style={{ background: '#111', border: '1px solid #222', borderLeft: '3px solid #f0a500', borderRadius: 12, padding: 32, marginBottom: 32 }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🎓</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Evergreen Safety Council — Member Discount</h2>
            <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
              OEH is an official Evergreen Safety Council member. All OEH Member, Pro, and Fleet subscribers save <strong style={{ color: '#f0a500' }}>5% on all bookable courses</strong> — P/EVO, WITPAC, Flagger, TCS, and more.
            </p>
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 16, display: 'inline-block' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Promo Code</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f0a500', letterSpacing: '0.05em' }}>OSEH2026</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Valid through April 30, 2027</div>
            </div>
            <br />
            <a
              href="https://www.esc.org/courses"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 6, textDecoration: 'none' }}
            >
              Browse ESC Courses →
            </a>
          </div>
        ) : (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 32, marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>🎓</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Evergreen Safety Council — Member Discount</h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                OEH members save 5% on all ESC courses. Promo code: XXXXXXXX
              </p>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: 12 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Member Feature</div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 16, textAlign: 'center', maxWidth: 260 }}>
                Upgrade to Member or Pro to unlock the 5% ESC promo code
              </div>
              <a href="/pricing" style={{ background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 6, textDecoration: 'none' }}>
                Upgrade to Member →
              </a>
            </div>
          </div>
        )}

        {/* Submit your certs CTA */}
        {user && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submit Your Certifications</h2>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
              Upload your P/EVO or vehicle verification docs in your OEH profile to get verified.
            </p>
            <a href="/?page=verification" style={{ background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 8, textDecoration: 'none' }}>
              Go to Verification Dashboard →
            </a>
          </div>
        )}

        {!user && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Get Verified on OEH</h2>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
              Sign in to submit your certifications and appear as a verified escort on the platform.
            </p>
            <a href="/signin?redirect=verification" style={{ background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 8, textDecoration: 'none' }}>
              Sign In to Get Verified →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
