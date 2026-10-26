import { createClient } from '@/lib/supabase/server'
import { FREE_LAUNCH } from '@/lib/free-launch'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

export const metadata = { title: 'Verify Your Escort Certifications | OEH' }

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { tier?: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const paidTiers = ['member', 'pro', 'fleet_starter', 'fleet_plus', 'fleet_pro']
  const isPaid = FREE_LAUNCH || (profile?.tier && paidTiers.includes(profile.tier))

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
      <div className="ui-wrap">
        <PageTitle eyebrow="Verification" title="Escort certification verification" lead="Verify P/EVO, WITPAC, Flagger, and Traffic Control Supervisor certifications through the Evergreen Safety Council's official tool." />
        <div className="ui-stack">

        <div className="ui-card good">
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
          <h2 style={{ color: 'var(--ui-green)' }}>ESC Certification Lookup</h2>
          <p className="ui-note" style={{ marginBottom: 16 }}>
            Use the Evergreen Safety Council's official verification tool to confirm any escort certification.
            Covers P/EVO, WITPAC, Flagger, and Traffic Control Supervisor (TCS) certs across all states.
          </p>
          <a
            href="https://www.esc.org/resources/certification-verification"
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn"
            style={{ background: 'var(--ui-green)', boxShadow: 'none' }}
          >
            Open ESC Verification Tool →
          </a>
          <p className="ui-meta" style={{ marginTop: 12 }}>esc.org/resources/certification-verification</p>
        </div>

        <div className="ui-card">
          <h2>Certifications Covered</h2>
          <div className="ui-fit">
            {[
              { name: 'P/EVO Certification', desc: 'Pilot/Escort Vehicle Operator' },
              { name: 'WITPAC', desc: 'Western Interstate Corridor' },
              { name: 'Flagger Certification', desc: 'Valid 3 years · WA/OR/ID/MT' },
              { name: 'Traffic Control Supervisor', desc: 'TCS — WA, OR, ID state certs' },
            ].map(cert => (
              <div key={cert.name} className="ui-card" style={{ padding: 16, boxShadow: 'none', borderColor: 'rgba(255,106,19,.45)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cert.name}</div>
                <div className="ui-meta">{cert.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {isPaid ? (
          <div className="ui-card warn">
            <div style={{ fontSize: 24, marginBottom: 10 }}>🎓</div>
            <h2>Evergreen Safety Council — Member Discount</h2>
            <p className="ui-note" style={{ marginBottom: 16 }}>
              OEH is an official Evergreen Safety Council member. All OEH Member, Pro, and Fleet subscribers save <strong style={{ color: 'var(--ui-or)' }}>5% on all bookable courses</strong> — P/EVO, WITPAC, Flagger, TCS, and more.
            </p>
            <div className="ui-card" style={{ padding: 16, display: 'inline-block', boxShadow: 'none', marginBottom: 16 }}>
              <div className="ui-k">Your Promo Code</div>
              <div className="ui-v or">OSEH2026</div>
              <div className="ui-meta" style={{ marginTop: 4 }}>Valid through April 30, 2027</div>
            </div>
            <br />
            <a href="https://www.esc.org/courses" target="_blank" rel="noopener noreferrer" className="ui-btn">
              Browse ESC Courses →
            </a>
          </div>
        ) : (
          <div className="ui-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>🎓</div>
              <h2>Evergreen Safety Council — Member Discount</h2>
              <p className="ui-note">
                OEH members save 5% on all ESC courses. Promo code: XXXXXXXX
              </p>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,8,10,.72)', borderRadius: 18, padding: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Member Feature</div>
              <div className="ui-note" style={{ marginBottom: 16, textAlign: 'center', maxWidth: 260 }}>
                Upgrade to Member or Pro to unlock the 5% ESC promo code
              </div>
              <a href="/pricing" className="ui-btn">Upgrade to Member →</a>
            </div>
          </div>
        )}

        {user && (
          <div className="ui-card" style={{ textAlign: 'center' }}>
            <h2>Submit Your Certifications</h2>
            <p className="ui-note" style={{ margin: '0 auto 16px' }}>
              Upload your P/EVO or vehicle verification docs in your OEH profile to get verified.
            </p>
            <a href="/verify" className="ui-btn">Go to Verification Dashboard →</a>
          </div>
        )}

        {!user && (
          <div className="ui-card" style={{ textAlign: 'center' }}>
            <h2>Get Verified on OEH</h2>
            <p className="ui-note" style={{ margin: '0 auto 16px' }}>
              Sign in to submit your certifications and appear as a verified escort on the platform.
            </p>
            <a href="/signin?redirect=verification" className="ui-btn">Sign In to Get Verified →</a>
          </div>
        )}
        </div>
      </div>
      </div>
    </>
  )
}
