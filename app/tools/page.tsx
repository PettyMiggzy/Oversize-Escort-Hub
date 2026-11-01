import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

export const metadata: Metadata = {
  title: 'Free tools for pilot cars',
  description: 'Free invoice maker, expense tracker and state permit directory for pilot car drivers and oversize carriers.',
  alternates: { canonical: '/tools' },
}

const TOOLS: [string, string, string, string][] = [
  ['/tools/invoice', 'Invoice maker', 'Add your logo, pick a color, download a clean PDF for your carrier. Made in your browser; nothing is stored on our servers.', 'Free, no account needed'],
  ['/tools/expenses', 'Expense tracker', 'Log fuel, lodging, tolls and miles. See totals by month and download a spreadsheet for your taxes.', 'Free, sign in to keep your entries'],
  ['/tools/permits', 'State permit directory', 'Phone numbers and websites for state permit offices. A reference only: always check the state yourself.', 'Free'],
]

export default function ToolsHub() {
  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 820 }}>
          <PageTitle eyebrow="Tools" title="Free tools for your business" lead="Pilot cars run their own business. These help with the paperwork. We do not check anyone or anything you enter." />
          <div className="ui-stack">
            {TOOLS.map(([href, name, text, tag]) => (
              <Link key={href} href={href} className="ui-card" style={{ textDecoration: 'none', display: 'block' }}>
                <h2 style={{ margin: '0 0 6px' }}>{name}</h2>
                <p className="ui-note" style={{ margin: '0 0 10px' }}>{text}</p>
                <span className="ui-k" style={{ margin: 0 }}>{tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
