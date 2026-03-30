// FILE: app/pricing/page.tsx
// ACTION: Replace ENTIRE file

export default function PricingPage() {
  return (
    <main style={S.main}>
      <Header />

      <section style={S.wrap}>
        <h1 style={S.h1}>Membership & Access</h1>
        <p style={S.sub}>
          Built to be fair, transparent, and incentive-driven.  
          Trial to explore. Member to compete. Pro to win.
        </p>

        {/* ===== TIERS ===== */}
        <div style={S.grid3}>
          <Tier
            badge="TRIAL"
            title="30-Day Trial"
            price="FREE"
            desc="Explore the platform and understand how the hub works."
            points={[
              "Profile required to view boards",
              "Regular load board access",
              "Bid board preview only",
              "Email notifications only",
              "No SMS alerts",
            ]}
          />

          <Tier
            badge="MEMBER"
            title="Member"
            price="$19.99 / month"
            highlight
            desc="Full access to compete for loads and build rank."
            points={[
              "Access to regular + bid boards",
              "60-second Pro delay on new bid loads",
              "Email notifications",
              "Rank + reviews enabled",
              "Annual option: 15% discount",
              "$1.99 daily access option",
              "$19.99 yearly compliance due",
            ]}
          />

          <Tier
            badge="PRO"
            title="Pro"
            price="$29.99 / month"
            desc="Priority access and competitive advantage."
            points={[
              "First 60-second bid access",
              "SMS alerts for bid board",
              "Priority tie-breaks",
              "No yearly compliance due",
              "20% off annual subscription",
              "Discounted verification pricing",
              "$4.99 daily Pro access option",
            ]}
          />
        </div>

        {/* ===== VERIFICATION ===== */}
        <div style={S.panel}>
          <h2 style={S.h2}>Verification & Compliance</h2>
          <p style={S.text}>
            Verification is optional but recommended. Where possible, certifications
            are verified and re-checked at random intervals.
          </p>

          <ul style={S.list}>
            <li>• Initial certification verification: <strong>$9.99</strong></li>
            <li>• Additional certificates: <strong>$3.99 each</strong></li>
            <li>• Pro members receive discounted verification</li>
            <li>• Money-back guarantee if verification cannot be completed</li>
          </ul>

          <div style={S.notice}>
            Escorts are responsible for maintaining proper insurance.  
            This platform provides visibility and verification where possible, not coverage.
          </div>
        </div>

        {/* ===== PAY TERMS ===== */}
        <div style={S.panel}>
          <h2 style={S.h2}>Pay Terms & Rules</h2>

          <ul style={S.list}>
            <li>• Fast Pay: within 10 business days (clearly flagged)</li>
            <li>• Custom pay timeframes allowed and displayed</li>
            <li>• Overnight recommended: $100</li>
            <li>• No-go fee (on-site cancel): $300 recommended</li>
            <li>• Escort cancel policy: tier reduction after 3 cancels in 60 days</li>
            <li>• 30-day suspension after repeated cancellations</li>
          </ul>

          <div style={S.notice}>
            All agreements are between escort and posting party.  
            Oversize Escort Hub provides the marketplace and transparency.
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Header() {
  return (
    <header style={S.header}>
      <a href="/" style={S.brand}>OVERSIZE ESCORT HUB</a>
      <nav style={S.nav}>
        <a style={S.navLink} href="/loads">Load Boards</a>
        <a style={S.navLink} href="/post-load">Post Load</a>
        <a style={S.navLink} href="/verify">Verification</a>
        <a style={S.navLink} href="/signin">Sign In</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer style={S.footer}>
      <div style={S.footerInner}>
        <div>
          <strong>OVERSIZE ESCORT HUB</strong>
          <div style={S.footerMuted}>
            support@oversize-escort-hub.com
          </div>
        </div>
        <div style={S.footerLinks}>
          <a style={S.footerLink} href="/terms">Terms</a>
          <a style={S.footerLink} href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

function Tier({
  badge,
  title,
  price,
  desc,
  points,
  highlight,
}: any) {
  return (
    <div
      style={{
        ...S.card,
        borderColor: highlight ? "rgba(0,168,232,0.6)" : S.card.border,
        boxShadow: highlight
          ? "0 18px 50px rgba(0,168,232,0.18)"
          : "none",
      }}
    >
      <div style={S.badge}>{badge}</div>
      <div style={S.cardTitle}>{title}</div>
      <div style={S.price}>{price}</div>
      <div style={S.desc}>{desc}</div>

      <ul style={S.points}>
        {points.map((p: string) => (
          <li key={p}>• {p}</li>
        ))}
      </ul>
    </div>
  );
}

/* ================= STYLES ================= */

const S: any = {
  main: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb" },

  header: {
    padding: "18px 56px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
  },
  brand: {
    fontWeight: 900,
    color: "#00a8e8",
    textDecoration: "none",
  },
  nav: { display: "flex", gap: 16 },
  navLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },

  wrap: { padding: "44px 56px" },
  h1: { margin: 0, fontSize: 40, fontWeight: 900 },
  h2: { margin: 0, fontSize: 28, fontWeight: 900 },
  sub: { marginTop: 8, color: "#9ca3af", maxWidth: 760 },

  grid3: {
    marginTop: 28,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 16,
  },

  card: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 22,
    padding: 20,
    backdropFilter: "blur(14px)",
  },

  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    marginBottom: 10,
  },

  cardTitle: { fontWeight: 950, fontSize: 18, color: "#00a8e8" },
  price: { marginTop: 6, fontWeight: 950, fontSize: 26 },
  desc: { marginTop: 6, fontSize: 14, color: "#9ca3af" },

  points: { marginTop: 12, paddingLeft: 12, lineHeight: 1.8 },

  panel: {
    marginTop: 36,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 22,
  },

  text: { marginTop: 8, fontSize: 15, color: "#cbd5e1", maxWidth: 860 },
  list: { marginTop: 12, lineHeight: 1.8 },

  notice: {
    marginTop: 14,
    fontSize: 12,
    color: "#9ca3af",
    borderLeft: "3px solid #00a8e8",
    paddingLeft: 10,
  },

  footer: {
    padding: "30px 56px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 50,
  },
  footerInner: { display: "flex", justifyContent: "space-between" },
  footerMuted: { fontSize: 13, color: "#9ca3af" },
  footerLinks: { display: "flex", gap: 16 },
  footerLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },
};
