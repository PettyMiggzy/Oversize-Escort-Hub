'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { REVIEW_TAGS } from '@/lib/quality'

type Load = {
  id: string
  carrier_id: string
  matched_escort_id?: string | null
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
  const [targetId, setTargetId] = useState<string | null>(null)
  const [revieweeRole, setRevieweeRole] = useState<'escort' | 'carrier'>('carrier')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/signin?redirect=/review/${loadId}`)
        return
      }
      const { data: ld, error: le } = await supabase
        .from('loads')
        .select('id, carrier_id, matched_escort_id, pu_city, pu_state, dl_city, dl_state, status')
        .eq('id', loadId)
        .single()
      if (le || !ld) {
        if (!cancelled) { setErr('Load not found.'); setLoading(false) }
        return
      }
      // only the two people on the load can review it: the carrier reviews the pilot car, the pilot car reviews the carrier
      const l = ld as Load
      const mine = l.carrier_id === user.id ? 'carrier' : l.matched_escort_id === user.id ? 'escort' : null
      if (!mine || !l.carrier_id || !l.matched_escort_id) {
        if (!cancelled) { setErr('Only the carrier and the pilot car on a matched load can review it.'); setLoading(false) }
        return
      }
      if (!cancelled) {
        setTargetId(mine === 'carrier' ? l.matched_escort_id! : l.carrier_id)
        setRevieweeRole(mine === 'carrier' ? 'escort' : 'carrier')
        setLoad(l); setLoading(false)
      }
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
        body: JSON.stringify({ loadId, targetUserId: targetId, rating, comment, tags }),
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
          <PageTitle eyebrow="Reviews" title="Leave a review" lead={revieweeRole === 'escort' ? 'Rate the pilot car on this load.' : 'Rate the carrier on this load.'} />
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
        ) : load && (
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
              <div className="ui-label">What stood out (optional)</div>
              <div className="ui-chips">
                {REVIEW_TAGS[revieweeRole].map((t) => (
                  <label key={t.key} className={tags.includes(t.key) ? 'ui-chip on' : 'ui-chip'}>
                    <input type="checkbox" checked={tags.includes(t.key)} onChange={() => setTags((p) => (p.includes(t.key) ? p.filter((x) => x !== t.key) : [...p, t.key]))} style={{ accentColor: 'var(--ui-or)' }} />
                    {t.label}
                  </label>
                ))}
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
                placeholder={revieweeRole === 'escort' ? 'How was your experience with this pilot car?' : 'How was your experience with this carrier?'}
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
