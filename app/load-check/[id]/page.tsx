import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { serviceClient } from '@/lib/service-client'
import { verifyLoadCheckToken } from '@/lib/load-lifecycle'
import CheckinButtons from './buttons'

export const metadata: Metadata = { title: 'Is your load still open?', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

// The page behind the "Still need escorts?" email. The link's signed token is the login; nothing else here reads private data.
export default async function LoadCheck({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params
  const { t } = await searchParams
  const ok = verifyLoadCheckToken(id, t)
  let line = ''
  let status = ''
  if (ok) {
    const { data } = await serviceClient().from('loads').select('pu_city, pu_state, dl_city, dl_state, status').eq('id', id).maybeSingle()
    if (data) { line = `${data.pu_city}, ${data.pu_state} to ${data.dl_city}, ${data.dl_state}`; status = String(data.status) }
  }
  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap" style={{ maxWidth: 640 }}>
        <PageTitle eyebrow="Your load" title="Is your load still open?" lead={line ? line : undefined} />
        {!ok || !line ? (
          <div className="ui-card"><p style={{ margin: 0, lineHeight: 1.6 }}>This link has expired or is not valid. <a className="ui-link" href="/dashboard">Sign in</a> to manage your loads.</p></div>
        ) : (
          <CheckinButtons loadId={id} token={String(t)} status={status} />
        )}
      </div>
    </div>
  )
}
