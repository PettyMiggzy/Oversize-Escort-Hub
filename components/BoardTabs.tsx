// The three boards as one place: small tabs that sit under the page title on each board.
import Link from 'next/link'

const TABS = [
  { key: 'flat', label: 'Flat rate', href: '/flat-rate', hint: 'Claim it' },
  { key: 'open', label: 'Open bid', href: '/open-loads', hint: 'Escorts bid' },
  { key: 'bid', label: '5-minute bid', href: '/bid-board', hint: 'Fast timer' },
] as const

export default function BoardTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <nav aria-label="Load boards" className="ui-chips" style={{ marginBottom: 20 }}>
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} className={`ui-chip${t.key === active ? ' on' : ''}`} aria-current={t.key === active ? 'page' : undefined} title={t.hint}>{t.label}</Link>
      ))}
    </nav>
  )
}
