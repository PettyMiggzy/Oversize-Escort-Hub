// FILE: app/page.tsx
// ACTION: Replace the ENTIRE contents of app/page.tsx with this file.
// NOTE: Only changes vs your last version:
// - Footer now includes About + Terms links (and keeps your tagline)
// - Adds S.footerRight + S.footerLink styles
// - Does NOT touch anything else.

export default function Page() {
  return (
    <main style={S.main}>
      {/* ===== LIVE MARKET TICKER ===== */}
      <div style={S.tickerBar}>
        <div style={S.ticker}>
          🔥 BID AWARDED • TX → LA • 271 mi • $2.95/mi • PRO WINDOW • ⚡ FASTPAY • Escort paid in 22 hrs •
          🛡 Verified Profile • ⭐ 5★ Review • 🟢 New Load • IN → OH • High Pole • 7-Day Pay •
          CA → NV • Route Survey • Bidding Live • Load Covered
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <header style={S.header}>
        <div>
          <div style={S.brand}>OVERSIZE ESCORT HUB</div>
          <div style={S.subBrand}>LIVE • RANKED • VERIFIED</div>
        </div>

        <nav style={S.nav}>
          <a href="/" style={S.navLink}>Home</a>
          <a href="/loads" style={S.navLink}>Load Boards</a>
          <a href="/pricing" style={S.navLink}>Membership</a>
          <a href="/verify" style={S.navLink}>Verification</a>
          <a href="/post-load" style={S.cta}>Post Load (FREE)</a>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section style={S.hero}>
        <div>
          <h1 style={S.h1}>
            Where Oversize Loads Meet
            <br />
            <span style={S.neon}>Professional Escorts</span>
          </h1>

          <p style={S.lead}>
            Oversize Escort Hub is a live, ranked marketplace built specifically for P/EVO work.
            Not a forum. Not a spreadsheet. A real operating system for escorts, brokers, and carriers.
          </p>

          <div style={S.actions}>
            <a href="/loads" style={S.primary}>View Load Boards</a>
            <a href="/pricing" style={S.secondary}>Join as Escort</a>
          </div>

          <div style={S.hypeRow}>
            <span>Post Loads FREE</span>
            <span>Ranked Bidding</span>
            <span>Two-Way Reviews</span>
            <span>Verification Layer</span>
            <span>FastPay Visibility</span>
          </div>
        </div>

        <div style={S.preview}>
          <div style={S.previewHeader}>Live Marketplace Preview</div>

          <div style={S.previewRow}>
            <strong>TX → LA</strong>
            <span>271 mi • Lead + Escort • FastPay</span>
            <span style={S.live}>Bidding Live</span>
          </div>

          <div style={S.previewRow}>
            <strong>IN → OH</strong>
            <span>312 mi • High Pole • 7-Day Pay</span>
            <span style={S.timer}>Pro Window 00:58</span>
          </div>

          <div style={S.previewRow}>
            <strong>CA → NV</strong>
            <span>Route Survey • 10-Day Pay</span>
            <span style={S.covered}>Covered</span>
          </div>
        </div>
      </section>

      {/* ===== INFO HUB (NO NUMBERS) ===== */}
      <section style={S.section}>
        <h2 style={S.h2}>How the Hub Works</h2>
        <p style={S.sectionLead}>
          Everything is designed around speed, trust, and accountability.
          What you see is what you bid. What you win is based on rank and reliability.
        </p>

        <div style={S.infoGrid}>
          <InfoCard
            title="Loads Are Posted Free"
            text="Brokers, carriers, and oversize operators can post unlimited loads at no cost. Required details keep the board clean and actionable."
            bullets={[
              "Pickup & drop city / state / zip",
              "Mileage or day rate",
              "Escort position required",
              "Pay terms & FastPay option",
              "Special certs or requirements",
            ]}
          />

          <InfoCard
            title="Two Load Boards"
            text="Choose how the job is awarded. The regular board is first-come. The bid board is competitive and timed."
            bullets={[
              "Regular board = instant contact",
              "Bid board = 5-minute auction window",
              "Award goes to the lowest reasonable bid that meets requirements",
              "Ties break by rank",
            ]}
          />

          <InfoCard
            title="Rank, Reviews & Trust"
            text="Both sides review each other. Rank is earned through completed work, reliability, and professionalism."
            bullets={[
              "Two-way reviews",
              "Hidden scoring system",
              "No rank loss from a single bad review",
              "Repeated cancels trigger cooldowns",
            ]}
          />

          <InfoCard
            title="Verification Layer"
            text="Optional certificate and insurance verification adds a visible trust badge where verification is possible."
            bullets={[
              "Cert verification (optional)",
              "Insurance checks when available",
              "Random ongoing audits",
              "Visible verified checkmark",
            ]}
          />
        </div>
      </section>

      {/* ===== COMING SOON ===== */}
      <section style={S.sectionAlt}>
        <h2 style={S.h2}>Coming Soon</h2>

        <div style={S.infoGrid}>
          <InfoCard
            title="Map Integration (Pro)"
            text="Smarter planning and faster decisions with integrated routing tools."
            bullets={[
              "Route preview + distance checks",
              "PU/DL map view",
              "Saved lanes & favorite regions",
              "One-click directions",
            ]}
          />

          <InfoCard
            title="Proof of Service"
            text="Completed job history tied directly to profiles for confidence and repeat work."
            bullets={[
              "Job completion records",
              "Dispute protection",
              "Repeat-hire confidence",
            ]}
          />

          <InfoCard
            title="Pro Invoicing"
            text="Create invoices, track payments, and simplify billing."
            bullets={[
              "Invoice generator",
              "Payment status tracking",
              "Export for accounting",
            ]}
          />

          <InfoCard
            title="Admin & Compliance Center"
            text="A real workflow for verification, audits, and enforcement."
            bullets={[
              "Verification queue + notes",
              "Delegate tasks to staff",
              "Suspend/ban enforcement by phone",
              "Audit history & evidence storage",
            ]}
          />

          <InfoCard
            title="Mobile Apps"
            text="Native apps for iOS and Android."
            bullets={[
              "Push notifications",
              "Bid alerts",
              "Profile & review access",
            ]}
          />
        </div>
      </section>

      {/* ===== COMING LATER (PRO PERKS) ===== */}
      <section style={S.section}>
        <h2 style={S.h2}>Coming Later (Pro Member Perks)</h2>
        <p style={S.sectionLead}>
          Negotiated discounts and real-world savings for drivers and escort companies.
        </p>

        <div style={S.infoGrid}>
          <InfoCard
            title="Tow & Recovery Discounts"
            text="Preferred pricing with partnered towing/recovery providers."
            bullets={[
              "Priority dispatch options",
              "Member discount rates",
              "Region-based partners",
            ]}
          />

          <InfoCard
            title="Repair & Maintenance Discounts"
            text="Shop network perks to cut downtime and costs."
            bullets={[
              "Brake/tires/oil service discounts",
              "Preferred scheduling",
              "Fleet-friendly pricing",
            ]}
          />

          <InfoCard
            title="Fuel & Fleet Programs"
            text="Fuel card options and fleet savings for Pro members."
            bullets={[
              "Fuel card partnerships",
              "Fleet spend tracking (later)",
              "Perk offers by region",
            ]}
          />

          <InfoCard
            title="Factor / Faster Pay Options"
            text="Future options to help escorts get paid quicker."
            bullets={[
              "Partner factoring tools",
              "Payment acceleration options",
              "Pro-only eligibility rules",
            ]}
          />

          <InfoCard
            title="Partner Marketplace"
            text="Verified vendors that serve the escort industry."
            bullets={[
              "Lighting & safety suppliers",
              "Pilot car equipment",
              "Insurance partners (where applicable)",
            ]}
          />

          <InfoCard
            title="Premium Profile Boosts"
            text="Pro visibility perks to help top performers get selected more often."
            bullets={[
              "Featured Pro slots",
              "Top escort / top broker highlights",
              "Performance badges",
            ]}
          />
        </div>
      </section>

      {/* ===== FOOTER (UPDATED ONLY) ===== */}
      <footer style={S.footer}>
        <span>© Oversize Escort Hub</span>
        <span style={S.footerRight}>
          <a href="/about" style={S.footerLink}>About</a>
          <a href="/terms" style={S.footerLink}>Terms</a>
          <span>Built for the industry • Not a forum</span>
        </span>
      </footer>

      <style>{`
        @keyframes tickerMove {
          from { transform: translateX(100%); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}

/* ===== COMPONENTS ===== */

function InfoCard({ title, text, bullets }: any) {
  return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>{title}</h3>
      <p style={S.cardText}>{text}</p>
      <ul style={S.list}>
        {bullets.map((b: string) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

/* ===== STYLES ===== */

const S: any = {
  main: {
    minHeight: "100vh",
    background: "#060b16",
    color: "#e5e7eb",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  tickerBar: {
    overflow: "hidden",
    borderBottom: "1px solid rgba(255,255,255,.1)",
  },
  ticker: {
    whiteSpace: "nowrap",
    padding: "10px",
    color: "#00b4ff",
    animation: "tickerMove 28s linear infinite",
    fontSize: 14,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "22px 48px",
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  brand: {
    fontSize: 28,
    fontWeight: 900,
    color: "#00b4ff",
    textShadow: "0 0 20px rgba(0,180,255,.35)",
  },
  subBrand: { fontSize: 12, opacity: 0.7 },

  nav: { display: "flex", gap: 16, alignItems: "center" },
  navLink: { color: "#e5e7eb", textDecoration: "none", fontWeight: 700 },
  cta: {
    background: "#00b4ff",
    color: "#001018",
    padding: "10px 16px",
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
  },

  hero: {
    padding: "48px",
    display: "grid",
    gridTemplateColumns: "1.1fr .9fr",
    gap: 32,
  },
  h1: { fontSize: 44, fontWeight: 900 },
  neon: { color: "#00b4ff" },
  lead: { marginTop: 14, fontSize: 18, opacity: 0.85 },

  actions: { marginTop: 20, display: "flex", gap: 12 },
  primary: {
    background: "#00b4ff",
    color: "#001018",
    padding: "14px 22px",
    borderRadius: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
  secondary: {
    padding: "14px 22px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.15)",
    color: "#e5e7eb",
    textDecoration: "none",
    fontWeight: 900,
  },

  hypeRow: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    fontSize: 13,
    opacity: 0.8,
  },

  preview: {
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18,
    padding: 16,
  },
  previewHeader: { color: "#00b4ff", fontWeight: 900, marginBottom: 10 },
  previewRow: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  live: { color: "#00b4ff", fontWeight: 900 },
  timer: { color: "#facc15", fontWeight: 900 },
  covered: { color: "#22c55e", fontWeight: 900 },

  section: { padding: "48px" },
  sectionAlt: {
    padding: "48px",
    background: "rgba(255,255,255,.02)",
    borderTop: "1px solid rgba(255,255,255,.06)",
  },
  h2: { fontSize: 32, fontWeight: 900 },
  sectionLead: { marginTop: 10, opacity: 0.75 },

  infoGrid: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: 16,
  },

  card: {
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: { color: "#00b4ff", fontWeight: 900 },
  cardText: { marginTop: 8, opacity: 0.8 },
  list: { marginTop: 10, paddingLeft: 18 },

  footer: {
    padding: "32px 48px",
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,.08)",
    opacity: 0.7,
  },

  // ✅ ADDED (ONLY)
  footerRight: { display: "flex", gap: 14, alignItems: "center" },
  footerLink: { color: "#e5e7eb", textDecoration: "none", fontWeight: 700 },
};
