'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
        router.replace(`/signin?next=/review/${loadId}`)
        return
      }
      // Must be an escort
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'escort') {
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
        body: JSON.stringify({ targetUserId: load.carrier_id, rating, comment }),
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

  const bg = '#0a0f1a'
  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '24px', maxWidth: 560, margin: '0 auto' as const }
  const label = { fontSize: 12, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 }
  const input = { width: '100%', background: '#0a0f1a', border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' as const }

  if (loading) return <div style={{ background: bg, minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: '40px 16px' }}>
      <main style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Leave a Review</h1>
        {load && (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={label}>Load Route</div>
            <div style={{ fontSize: 15 }}>
              {(load.pu_city || '—')}, {load.pu_state || ''} → {(load.dl_city || '—')}, {load.dl_state || ''}
            </div>
          </div>
        )}

        {done ? (
          <div style={card}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Thanks — review submitted.</div>
            <button onClick={() => router.push('/dashboard')} style={{ background: '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Back to dashboard</button>
          </div>
        ) : (
          <div style={card}>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>Rating</div>
              <div style={{ display: 'flex', gap: 6 }}>
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
                      color: n <= rating ? '#f60' : '#374151',
                      padding: 0,
                    }}
                  >
                    ★
                  </button>
                ))}
                <span style={{ alignSelf: 'center', marginLeft: 8, color: '#9ca3af', fontSize: 13 }}>{rating}/5</span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={label}>Comment</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="How was your experience with this carrier?"
                style={{ ...input, resize: 'vertical' }}
              />
            </div>

            {err && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 10 }}>{err}</div>}

            <button
              onClick={submit}
              disabled={submitting}
              style={{
                background: submitting ? '#7a3500' : '#f60',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 18px',
                fontWeight: 600,
                cursor: submitting ? 'default' : 'pointer',
                fontSize: 13,
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
