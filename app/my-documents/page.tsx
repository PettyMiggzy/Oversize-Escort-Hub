import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import Documents from './_client'

export const metadata: Metadata = { title: 'My documents', robots: { index: false, follow: false } }

export default function MyDocumentsPage() {
  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap" style={{ maxWidth: 760 }}>
        <PageTitle eyebrow="Account" title="My documents" lead="Upload your certificate and proof of insurance, and choose whether they show on your public profile. Optional." />
        <Documents />
      </div>
    </div>
  )
}
