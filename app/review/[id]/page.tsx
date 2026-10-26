'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

type Load = {
  id: string
  carrier_id: string
  pu_city?: string | null
  pu_state?: string | null
  dl_city?: string | null
  dl_state?: string | null
  status?: string
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const loadId = params?.id
  const supabase = createClient()

  const [load, setLoad] = useState<Load | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/signin?redirect=/review/${loadId}`)
        return
      }
      // Must be an escort
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'escort' && profile?.role !== 'fleet_manager') {
        if (!cancelled) {
          setErr('Only escorts can leave a review for a carrier.')
          setLoading(false)
        }
        return
      }
      const { data: ld, error: le } = await supabase
        .from('loads')
        .select('id, carrier_id, pu_city, pu_state, dl_city, dl_state, status')
        .eq('id', loadId)
        .single()
      if (le || !ld) {
        if (!cancelled) { setErr('Load not found.'); setLoading(false) }
        return
      }
      if (!cancelled) { setLoad(ld as Load); setLoading(false) }
    }
    init()
    return () => { cancelled = true }
  }, [loadId, router, supabase])

  async function submit() {
    if (!load) return
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadId, targetUserId: load.carrier_id, rating, comment }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to submit review')
      setDone(true)
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (<><SiteHeader /><div className="ui-page"><div className="ui-wrap" style={{ textAlign: 'center' }}><p className="ui-meta">Loading…</p></div></div></>)

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 680 }}>
          <PageTitle eyebrow="Reviews" title="Leave a review" lead="Rate the carrier on this load." />
          <div className="ui-stack">
        {load && (
          <div className="ui-card">
            <div className="ui-label">Load Route</div>
            <div className="ui-route" style={{ fontSize: 16 }}>
              {(load.pu_city || '—')}, {load.pu_state || ''} → {(load.dl_city || '—')}, {load.dl_state || ''}
            </div>
          </div>
        )}
        {err && !load && <p className="ui-err">{err}</p>}

        {done ? (
          <div className="ui-card">
            <h2>Thanks — review submitted.</h2>
            <button className="ui-btn" onClick={() => router.push('/dashboard')}>Back to dashboard</button>
          </div>
        ) : (
          <div className="ui-card">
            <div style={{ marginBottom: 14 }}>
              <div className="ui-label">Rating</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 28,
                      lineHeight: 1,
                      color: n <= rating ? 'var(--ui-or)' : 'var(--ui-dim)',
                      minWidth: 44,
                      minHeight: 44,
                    }}
                  >
                    ★
                  </button>
                ))}
                <span className="ui-meta">{rating}/5</span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="ui-label" htmlFor="review-comment">Comment</label>
              <textarea
                id="review-comment"
                className="ui-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="How was your experience with this carrier?"
                style={{ resize: 'vertical' }}
              />
            </div>

            {err && <div className="ui-err">{err}</div>}

            <button onClick={submit} disabled={submitting} className={submitting ? 'ui-btn dim' : 'ui-btn'}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  )
}
