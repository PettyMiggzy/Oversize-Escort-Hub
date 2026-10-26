import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function EscortProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: profile } = await svc.from('profiles').select('id, full_name, role, tier, bio, bgc_verified, rating, review_count, avatar_url, pevo_verified, state, vehicle, states_licensed, availability_states, is_available, created_at').eq('id', id).single()
  if (!profile) notFound()

  const { data: certs } = await svc.from('certifications').select('*').eq('user_id', id)
  const { data: zones } = await svc.from('escort_availability').select('*').eq('escort_id', id)
  const { data: reviews } = await svc
    .from('reviews')
    .select('*')
    .eq('reviewee_id', id)
    .order('created_at', { ascending: false })

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 760 }}>
          <Link href="/find-escorts" className="ui-back">← Back to Find Escorts</Link>
          <PageTitle
            eyebrow="Escorts"
            title={profile.full_name || 'Unnamed Escort'}
            lead="Zones, certifications and reviews for this escort."
          />
          <div className="ui-stack">
        <div className="ui-card">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className={profile.tier === 'pro' ? 'ui-badge orange' : 'ui-badge dim'}>
              {profile.tier === 'pro' ? '⭐ Pro' : 'Member'}
            </span>
            {profile.bgc_verified && <span className="ui-badge green">✓ Background Check Verified</span>}
            {profile.role === 'escort' && <span className="ui-badge blue">P/EVO Escort</span>}
          </div>
          {profile.bio && <p className="ui-note">{profile.bio}</p>}

          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, gap: 6 }}>
              <span className="ui-v or" style={{ fontSize: 20 }}>★</span>
              <span className="ui-v" style={{ fontSize: 18 }}>{avgRating}</span>
              <span className="ui-meta">({reviews?.length} review{reviews?.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {zones && zones.length > 0 && (
          <div className="ui-card">
            <h2>Availability Zones</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {zones.map((z: any) => (
                <span key={z.id || z.location_state} className="ui-badge orange">{z.location_state}</span>
              ))}
            </div>
          </div>
        )}

        {certs && certs.length > 0 && (
          <div className="ui-card">
            <h2>Certifications</h2>
            {certs.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.status === 'approved' ? 'var(--ui-green)' : 'var(--ui-dim)' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.type?.toUpperCase()}</span>
                <span className={c.status === 'approved' ? 'ui-ok' : 'ui-meta'} style={{ margin: 0 }}>{c.status}</span>
              </div>
            ))}
          </div>
        )}

        {reviews && reviews.length > 0 ? (
          <div className="ui-card">
            <h2>Reviews</h2>
            {reviews.map((r: any) => (
              <div key={r.id} className="ui-card" style={{ padding: '14px 16px', marginBottom: 10, boxShadow: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.reviewer_name || 'Anonymous'}</span>
                  <span style={{ color: 'var(--ui-amber)' }}>{'★'.repeat(r.rating || 0)}</span>
                  <span className="ui-meta">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                </div>
                {r.comment && <p className="ui-note">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={(!zones || zones.length === 0) && (!certs || certs.length === 0) ? 'No additional profile details yet' : 'No reviews yet'}
            text={(!zones || zones.length === 0) && (!certs || certs.length === 0) ? 'Zones, certifications and reviews will show here once this escort adds them.' : 'Reviews show up here after a finished job.'}
          />
        )}
          </div>
        </div>
      </div>
    </>
  )
}
