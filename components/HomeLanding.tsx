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

export default function HomeLanding({ onCarrier, onEscort, onBroker, onFleet, onSignIn }: Props) {
  const pick = { carrier: onCarrier, escort: onEscort, broker: onBroker, fleet: onFleet }
  return (
    <div className="hl">
      <div className="hl-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hl-logo" src="/logo-3d.png" alt="Oversize Escort Hub" />
        <div className="hl-links">
          <a href="/open-loads">Find loads</a>
          <a href="/find-escorts">Find escorts</a>
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <button className="hl-si" onClick={onSignIn}>Sign in</button>
        </div>
      </div>

      <div className="hl-hero">
        <div className="hl-pill">Free while we launch</div>
        <h1 className="bb">Find escorts.<br /><span>Find loads.</span> Get moving.</h1>
        <p className="hl-sub">The load board for oversize carriers and pilot car operators. Post a load or pick one up, bid, and get matched.</p>
        <div className="hl-cta">
          <button className="hl-btn or" onClick={onCarrier}>I need an escort &rarr;</button>
          <button className="hl-btn ol" onClick={onEscort}>I&apos;m an escort &rarr;</button>
        </div>
        <div className="hl-or">Or sign up as</div>
        <div className="hl-chips">
          <button className="hl-chip" onClick={onCarrier}>Oversize carrier</button>
          <button className="hl-chip" onClick={onBroker}>Freight broker</button>
          <button className="hl-chip" onClick={onFleet}>Fleet manager</button>
        </div>
      </div>

      <div className="hl-sec">
        <div className="hl-t"><h2 className="bb">How will you use OEH?</h2><p>Pick your role. It&apos;s free while we launch.</p></div>
        <div className="hl-grid">
          {ROLES.map((r) => (
            <button key={r.key} className="hl-card" onClick={pick[r.key]}>
              <div className="hl-ph" style={{ backgroundImage: `url(${r.photo})`, backgroundPosition: r.pos }} />
              <div className="hl-body">
                <h3 className="bb" style={{ color: r.color }}>{r.title}</h3>
                <p>{r.text}</p>
                <span className="hl-go" style={{ color: r.color }}>{r.go} &rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="hl-foot">
        <span>&copy; Oversize Escort Hub &middot; US and Canada</span>
        <span><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/contact">Contact</a>Photos courtesy of Wells Safety</span>
      </div>
    </div>
  )
}
