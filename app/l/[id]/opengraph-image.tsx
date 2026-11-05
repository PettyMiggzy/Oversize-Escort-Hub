import { ImageResponse } from 'next/og'
import { getShareLoad, isOpenToShare } from '@/lib/share-load'
import { shareSummary } from '@/lib/share-text'

export const alt = 'Pilot car load on Oversize Escort Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

// The picture Facebook shows when a load link is pasted: route, rate, date. No names or contact details.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await getShareLoad(id)
  const route = l ? l.route.replace(' to ', '  →  ') : 'Oversize Escort Hub'
  const line = l ? (isOpenToShare(l) ? shareSummary(l) : 'This load is no longer posted') : 'Free load board for pilot cars and oversize carriers'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a0c10', color: '#fff', padding: 64, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#ff6a13', letterSpacing: 2 }}>OVERSIZE ESCORT HUB</div>
          {l?.urgent && <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, color: '#fff', background: '#d93b3b', padding: '8px 22px', borderRadius: 999 }}>URGENT</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#ffb067', marginBottom: 14, fontWeight: 700 }}>PILOT CAR LOAD</div>
          <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, lineHeight: 1.08 }}>{route}</div>
          <div style={{ display: 'flex', fontSize: 34, color: '#c9d0da', marginTop: 22 }}>{line}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#120800', background: '#ff6a13', padding: '14px 34px', borderRadius: 999 }}>Free to claim or bid</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#9aa3b2' }}>oversize-escort-hub.com</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
