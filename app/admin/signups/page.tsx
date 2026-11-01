'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Day = { date: string; escort: number; carrier: number; broker: number; fleet_manager: number; other: number; total: number }
type Data = { days: Day[]; today: number; last7: number; prev7: number; last30: number; bestDay: number }

const COLORS: [keyof Omit<Day, 'date' | 'total'>, string, string][] = [
  ['escort', 'Pilot cars', '#ff6a13'],
  ['carrier', 'Carriers', '#4aa3ff'],
  ['broker', 'Brokers', '#b58cff'],
  ['fleet_manager', 'Fleet managers', '#3ddc97'],
  ['other', 'Other', '#7d8aa0'],
]

function label(date: string) {
  const [, m, d] = date.split('-')
  return `${Number(m)}/${Number(d)}`
}

export default function SignupsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading')
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/signups')
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) return setState('denied')
        if (!r.ok) return setState('error')
        setData(await r.json())
        setState('ok')
      })
      .catch(() => setState('error'))
  }, [])

  const wrap = { background: '#0b0d10', minHeight: '100vh', color: '#fff', fontFamily: 'inherit' } as const
  if (state !== 'ok' || !data) {
    return <div style={{ ...wrap, display: 'grid', placeItems: 'center' }}>{state === 'loading' ? 'Loading...' : state === 'denied' ? 'Admin access required.' : 'Could not load sign-ups.'}</div>
  }

  const max = Math.max(5, data.bestDay)
  const top = Math.ceil(max / 4) * 4
  const W = 960, H = 280, L = 36, B = 28
  const bw = (W - L) / data.days.length
  const delta = data.last7 - data.prev7
  const stats: [string, string, string?][] = [
    ['Today', String(data.today)],
    ['Last 7 days', String(data.last7), data.prev7 || data.last7 ? `${delta >= 0 ? '+' : ''}${delta} vs the 7 days before` : undefined],
    ['Last 30 days', String(data.last30)],
    ['Best day', String(data.bestDay)],
  ]
  const h = hover === null ? null : data.days[hover]

  return (
    <div style={wrap}>
      <style>{`.su-only{display:none}@media (max-width:1023px){.su-only{display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center;color:#b5bdc9}.su-main{display:none}}`}</style>
      <div className="su-only">This page is built for a desktop screen. Open it on a computer.</div>
      <div className="su-main" style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px 64px' }}>
        <Link href="/admin" style={{ color: '#ffb067', fontSize: 14, textDecoration: 'none' }}>← Admin</Link>
        <h1 style={{ fontSize: 30, margin: '10px 0 4px' }}>Daily sign-ups</h1>
        <p style={{ margin: 0, color: '#8b95a5', fontSize: 14 }}>New accounts per day, last 30 days, US Eastern time. Admin accounts are not counted.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '28px 0' }}>
          {stats.map(([k, v, sub]) => (
            <div key={k} style={{ background: '#13161b', border: '1px solid #232830', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8b95a5' }}>{k}</div>
              <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>{v}</div>
              <div style={{ fontSize: 12, color: '#8b95a5', minHeight: 16, marginTop: 4 }}>{sub ?? ''}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#13161b', border: '1px solid #232830', borderRadius: 14, padding: '20px 20px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 22 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {COLORS.map(([, name, c]) => (
                <span key={name} style={{ fontSize: 12, color: '#b5bdc9', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />{name}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#e9edf3' }}>
              {h ? `${label(h.date)}: ${h.total} sign-up${h.total === 1 ? '' : 's'}` : ''}
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Daily sign-ups, last 30 days">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const y = H - B - f * (H - B - 8)
              return (
                <g key={f}>
                  <line x1={L} x2={W} y1={y} y2={y} stroke="#232830" />
                  <text x={L - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7586">{Math.round(f * top)}</text>
                </g>
              )
            })}
            {data.days.map((d, i) => {
              let y = H - B
              const x = L + i * bw + bw * 0.18
              const w = bw * 0.64
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={L + i * bw} y={0} width={bw} height={H - B} fill={hover === i ? 'rgba(255,255,255,.04)' : 'transparent'} />
                  {COLORS.map(([key, , c]) => {
                    const hgt = (d[key] / top) * (H - B - 8)
                    if (!hgt) return null
                    y -= hgt
                    return <rect key={key} x={x} y={y} width={w} height={hgt} rx={2} fill={c} />
                  })}
                  {i % 5 === 0 || i === data.days.length - 1 ? <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7586">{label(d.date)}</text> : null}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
