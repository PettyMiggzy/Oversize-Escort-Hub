'use client'
// The logged-out home page: a plain explanation of what OEH is, two main ways in, and every role.
// Role choices keep the sign-up behaviour the old role picker had; the parent passes the handlers.
type Props = {
  onCarrier: () => void
  onEscort: () => void
  onBroker: () => void
  onFleet: () => void
  onSignIn: () => void
}

const ROLES = [
  { key: 'carrier', title: 'Oversize carrier', text: 'Post loads, get bids from escorts, and fill the job fast.', go: 'Post a load', color: 'var(--or)', photo: '/photos/carrier.webp', pos: '30% 45%' },
  { key: 'escort', title: 'Pilot car / P/EVO', text: 'Find loads near you, bid, and cut the empty miles home.', go: 'Find loads', color: 'var(--am)', photo: '/photos/escort.webp', pos: '50% 40%' },
  { key: 'broker', title: 'Freight broker', text: 'Book escorts for your oversize shipments.', go: 'Find escorts', color: '#c1c8d4', photo: '/photos/broker.webp', pos: '50% 45%' },
  { key: 'fleet', title: 'Fleet manager', text: 'Run several escorts at once and keep every truck moving.', go: 'Manage a fleet', color: '#4f8cff', photo: '/photos/fleet.webp', pos: '70% 50%' },
] as const

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
const TruckIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8zM6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z" /></svg>
)
const CarIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 16l1.5-5.5A2 2 0 018.4 9h7.2a2 2 0 011.9 1.5L19 16M3 16h18v3H3zM8 6l1-2h6l1 2M7 19v1M17 19v1" /></svg>
)
const FleetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1M16 5a3 3 0 010 6M21 20v-1a5 5 0 00-3-4.6" /></svg>
)
const BrokerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></svg>
)

export default function HomeLanding({ onCarrier, onEscort, onBroker, onFleet, onSignIn }: Props) {
  const pick = { carrier: onCarrier, escort: onEscort, broker: onBroker, fleet: onFleet }
  return (
    <div className="hl">
      <div className="hl-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hl-logo" src="/logo-wordmark.png" alt="Oversize Escort Hub" />
        <div className="hl-links">
          <a href="/open-loads">Find loads</a>
          <a href="/find-escorts">Find escorts</a>
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <button className="hl-si" onClick={onSignIn}>Sign in</button>
          <button className="hl-gs" onClick={onCarrier}>Get started</button>
        </div>
      </div>

      <div className="hl-hero">
        <div className="hl-wrap">
          <div className="hl-eyebrow"><i />Move Bigger<span className="hl-pill">Free while we launch</span></div>
          <h1 className="bb">Find escorts.<br /><span>Find loads.</span><br />Get moving.</h1>
          <p className="hl-sub">The load board for oversize and overweight trucking in the U.S. and Canada. Post a load or pick one up, bid, and get matched.</p>

          <div className="hl-panel">
            <div className="hl-eyebrow sm"><i />Choose your role</div>
            <div className="hl-two">
              <button className="hl-big hot" onClick={onCarrier}>
                <span className="hl-ico"><TruckIcon /></span>
                <span className="hl-go"><ArrowIcon /></span>
                <strong>I need an escort</strong>
                <span>Carriers and freight brokers post loads, get bids and fill the job.</span>
              </button>
              <button className="hl-big" onClick={onEscort}>
                <span className="hl-ico"><CarIcon /></span>
                <span className="hl-go"><ArrowIcon /></span>
                <strong>I&apos;m an escort</strong>
                <span>Pilot car and P/EVO operators find loads, bid or claim them, and plan return trips.</span>
              </button>
            </div>
            <div className="hl-two slim">
              <button className="hl-row" onClick={onFleet}>
                <span className="hl-ico sm"><FleetIcon /></span>
                <span><strong>Fleet manager</strong><em>Run several escorts and keep every truck moving.</em></span>
                <ArrowIcon />
              </button>
              <button className="hl-row" onClick={onBroker}>
                <span className="hl-ico sm"><BrokerIcon /></span>
                <span><strong>Freight broker</strong><em>Book escorts for your oversize shipments.</em></span>
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hl-sec">
        <div className="hl-t"><h2 className="bb">Built for every role</h2><p>One board for the whole move. It&apos;s free while we launch.</p></div>
        <div className="hl-grid">
          {ROLES.map((r) => (
            <button key={r.key} className="hl-card" onClick={pick[r.key]}>
              <div className="hl-ph" style={{ backgroundImage: `url(${r.photo})`, backgroundPosition: r.pos }} />
              <div className="hl-body">
                <h3 className="bb" style={{ color: r.color }}>{r.title}</h3>
                <p>{r.text}</p>
                <span className="hl-link" style={{ color: r.color }}>{r.go} &rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="hl-foot">
        <span>&copy; Oversize Escort Hub &middot; US and Canada</span>
        <span><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/contact">Contact</a><a href="https://www.facebook.com/oversizeescorthub" target="_blank" rel="noopener noreferrer">Facebook</a>Photos courtesy of Wells Safety</span>
      </div>
    </div>
  )
}
