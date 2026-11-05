import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import ShareButtons from '@/components/ShareButtons'
import { getShareLoad, isOpenToShare } from '@/lib/share-load'
import { SITE_URL, loadLink, shareSummary, shareText } from '@/lib/share-text'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const l = await getShareLoad(id)
  const metadataBase = new URL(SITE_URL)
  if (!l) return { metadataBase, title: 'Load', robots: { index: false, follow: false } }
  const title = `${l.urgent ? 'URGENT: ' : ''}Pilot car load: ${l.route}`
  return {
    metadataBase,
    title,
    description: shareSummary(l),
    robots: { index: false, follow: false },
    openGraph: { title, description: `${shareSummary(l)}. Free to claim or bid.`, url: loadLink(id), siteName: 'Oversize Escort Hub', type: 'website' },
    twitter: { card: 'summary_large_image', title, description: shareSummary(l) },
  }
}

// The page behind a shared load card. Anyone can read it; claiming or bidding needs a free account.
export default async function SharedLoad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await getShareLoad(id)
  if (!l) notFound()
  const open = isOpenToShare(l)
  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 640 }}>
          <div className="ui-card" style={{ marginTop: 8 }}>
            <div className="ui-k">{l.urgent ? 'Urgent pilot car load' : 'Pilot car load'}</div>
            <h1 style={{ margin: '6px 0 4px', fontSize: 28, lineHeight: 1.15, color: '#fff' }}>{l.route.replace(' to ', ' → ')}</h1>
            <p className="ui-note" style={{ margin: '0 0 14px' }}>{l.needs > 1 ? `${l.needs} escorts needed` : '1 escort needed'} · {l.position}</p>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
              {l.rate && <div><div className="ui-k">Rate</div><div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ui-or)' }}>{l.rate}</div></div>}
              {l.total && <div><div className="ui-k">About</div><div style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>${l.total.toLocaleString()}</div><div className="ui-note" style={{ margin: 0 }}>{l.miles?.toLocaleString()} mi, an estimate</div></div>}
              {l.date && <div><div className="ui-k">Needed</div><div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{l.date}</div></div>}
            </div>
            {open ? (
              <>
                <Link href={`/signin?mode=signup&redirect=/loads/${l.id}`} className="ui-btn block">{l.board === 'flat-rate' ? 'Claim this load (free)' : 'Bid on this load (free)'}</Link>
                <p className="ui-note" style={{ margin: '10px 0 0', textAlign: 'center' }}>Free account. Already have one? <Link href={`/signin?redirect=/loads/${l.id}`} style={{ color: 'var(--ui-or)' }}>Sign in</Link></p>
              </>
            ) : (
              <div className="ui-note" style={{ margin: 0, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--ui-line)' }}>
                This load is {l.status === 'open' ? 'no longer posted' : l.status === 'filled' ? 'filled' : l.status.replace('_', ' ')}. <Link href="/flat-rate" style={{ color: 'var(--ui-or)' }}>See open loads</Link>
              </div>
            )}
          </div>
          <div style={{ margin: '16px 0' }}><ShareButtons url={loadLink(l.id)} text={shareText(l)} /></div>
          <p className="ui-note">Oversize Escort Hub is a free load board for pilot cars and oversize carriers. We do not check anyone or any load. Confirm the details, your permits, licenses and insurance yourself. Contact details are shared only after a match. Hauling oversize? <Link href="/quick-post" style={{ color: 'var(--ui-or)' }}>Post a load free, no account needed.</Link></p>
        </div>
      </div>
    </>
  )
}
