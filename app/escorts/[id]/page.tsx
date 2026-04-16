import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function EscortProfilePage({ params }: { params: { id: string } }) {
  const { data: profile } = await svc.from('profiles').select('*').eq('id', params.id).single()
  if (!profile) notFound()

  const { data: certs } = await svc.from('certifications').select('*').eq('user_id', params.id)
  const { data: zones } = await svc.from('escort_availability').select('*').eq('escort_id', params.id)
  const { data: reviews } = await svc
    .from('reviews')
    .select('*')
    .eq('escort_id', params.id)
    .order('created_at', { ascending: false })

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  const S = {
    page: { minHeight: '100vh', background: '#060b16', color: '#e5e7eb', fontFamily: 'system-ui,sans-serif' },
    header: { padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    brand: { fontWeight: 900, color: '#f0a500', textDecoration: 'none', fontSize: 18 },
    back: { color: '#9ca3af', textDecoration: 'none', fontSize: 14 },
    wrap: { maxWidth: 720, margin: '0 auto', padding: '40px 24px' },
    card: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, marginBottom: 24 },
    name: { fontSize: 28, fontWeight: 800, marginBottom: 8 },
    badges: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 },
    badge: (color: string) => ({ background: color, color: '#000', fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20 }),
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 14, fontWeight: 700, color: '#f0a500', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 },
    stars: { color: '#f0a500', fontSize: 20, marginRight: 6 },
    ratingNum: { fontSize: 18, fontWeight: 700 },
    reviewCard: { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 },
    reviewHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
    reviewName: { fontWeight: 600, fontSize: 14 },
    reviewDate: { color: '#6b7280', fontSize: 12 },
    reviewText: { fontSize: 14, color: '#d1d5db' },
    zoneGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
    zone: { background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.3)', color: '#f0a500', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 600 },
    certRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
    certDot: (approved: boolean) => ({ width: 8, height: 8, borderRadius: '50%', background: approved ? '#22c55e' : '#6b7280' }),
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <Link href="/" style={S.brand}>OVERSIZE ESCORT HUB</Link>
        <Link href="/find-escorts" style={S.back}>← Back to Find Escorts</Link>
      </header>
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.name}>{profile.full_name || 'Unnamed Escort'}</div>
          <div style={S.badges}>
            <span style={S.badge(profile.membership === 'pro' ? '#f0a500' : '#6b7280')}>
              {profile.membership === 'pro' ? '⭐ Pro' : 'Member'}
            </span>
            {profile.bgc_verified && <span style={S.badge('#22c55e')}>✓ BGC Verified</span>}
            {profile.role === 'escort' && <span style={S.badge('#3b82f6')}>P/EVO Escort</span>}
          </div>
          {profile.bio && <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>{profile.bio}</p>}

          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
              <span style={S.stars}>★</span>
              <span style={S.ratingNum}>{avgRating}</span>
              <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 6 }}>({reviews?.length} review{reviews?.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {zones && zones.length > 0 && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Availability Zones</div>
            <div style={S.zoneGrid}>
              {zones.map((z: any) => (
                <span key={z.id || z.state} style={S.zone}>{z.state}</span>
              ))}
            </div>
          </div>
        )}

        {certs && certs.length > 0 && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Certifications</div>
            {certs.map((c: any) => (
              <div key={c.id} style={S.certRow}>
                <div style={S.certDot(c.status === 'approved')} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.type?.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: c.status === 'approved' ? '#22c55e' : '#6b7280' }}>{c.status}</span>
              </div>
            ))}
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Reviews</div>
            {reviews.map((r: any) => (
              <div key={r.id} style={S.reviewCard}>
                <div style={S.reviewHeader}>
                  <span style={S.reviewName}>{r.reviewer_name || 'Anonymous'}</span>
                  <span style={{ color: '#f0a500' }}>{'★'.repeat(r.rating || 0)}</span>
                  <span style={S.reviewDate}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                </div>
                {r.comment && <p style={S.reviewText}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {(!reviews || reviews.length === 0) && (!zones || zones.length === 0) && (!certs || certs.length === 0) && (
          <div style={{ ...S.card, textAlign: 'center', color: '#6b7280' }}>
            No additional profile details yet.
          </div>
        )}
      </div>
    </div>
  )
}
