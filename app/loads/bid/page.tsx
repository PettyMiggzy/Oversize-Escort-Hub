// FILE: app/loads/bid/page.tsx
// ACTION: Replace ENTIRE file
// PURPOSE: Bid Board – ranked, timed, Pro-priority

export default function BidBoardPage() {
  return (
    <main style={S.main}>
      <Header />

      {/* LIVE CONTEXT BAR */}
      <div style={S.contextBar}>
        <span>BID BOARD</span>
        <span> • </span>
        <span>5-MINUTE WINDOW</span>
        <span> • </span>
        <span>PRO PRIORITY • RANKED TIE-BREAKS</span>
      </div>

      <section style={S.wrap}>
        <div style={S.topRow}>
          <h1 style={S.h1}>Bid Board</h1>
          <div style={S.timerPill}>LIVE WINDOW • 03:42</div>
        </div>

        <p style={S.sub}>
          Escorts place bids during a 5-minute window.  
          Lowest acceptable bid wins. Ties break by rank.
        </p>

        {/* FILTERS */}
        <div style={S.filterPanel}>
          <Filter label="Newest" />
          <Filter label="State" />
          <Filter label="Position" />
          <Filter label="Distance" />
          <Filter label="FastPay" />
          <Filter label="Pro Window" />
        </div>

        {/* BID LIST */}
        <div style={S.list}>
          <BidCard
            route="TX → LA"
            position="Lead Escort"
            miles="271 mi"
            max="$3.10 / mi max"
            fastPay
            window="02:18 left"
            bids={[
              { price: "$2.95 / mi", tier: "PRO" },
              { price: "$3.05 / mi", tier: "MEMBER" },
            ]}
          />

          <BidCard
            route="IN → OH"
            position="High Pole"
            miles="312 mi"
            max="$850 day max"
            window="04:12 left"
            bids={[
              { price: "$750 day", tier: "MEMBER" },
            ]}
          />
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
        <a style={S.navLink} href="/loads">Regular Board</a>
        <a style={S.navLink} href="/loads/bid">Bid Board</a>
        <a style={S.navLink} href="/pricing">Membership</a>
        <a style={S.navLink} href="/signin">Account</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer style={S.footer}>
      <div style={S.footerInner}>
        <strong>OVERSIZE ESCORT HUB</strong>
        <span style={S.footerMuted}>
          Bid board • Ranked • Timed
        </span>
      </div>
    </footer>
  );
}

function Filter({ label }: { label: string }) {
  return <div style={S.filter}>{label}</div>;
}

function BidCard({
  route,
  position,
  miles,
  max,
  fastPay,
  window,
  bids,
}: any) {
  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <strong style={S.route}>{route}</strong>
        <span style={S.badge}>{position}</span>
      </div>

      <div style={S.meta}>
        <span>{miles}</span>
        <span>{max}</span>
        {fastPay && <span style={S.fastPay}>FASTPAY</span>}
      </div>

      <div style={S.bidSection}>
        <div style={S.bidHeader}>
          <span>Active Bids</span>
          <span style={S.window}>{window}</span>
        </div>

        {bids.map((b: any, i: number) => (
          <div key={i} style={S.bidRow}>
            <span>{b.price}</span>
            <span style={S.tier}>{b.tier}</span>
          </div>
        ))}
      </div>

      <button style={S.primaryBtn}>PLACE BID</button>
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

  contextBar: {
    padding: "10px 56px",
    fontSize: 12,
    letterSpacing: 1.4,
    color: "#9ca3af",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  wrap: { padding: "36px 56px" },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { margin: 0, fontSize: 38, fontWeight: 900 },

  timerPill: {
    padding: "8px 14px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    background: "rgba(0,168,232,0.15)",
    border: "1px solid rgba(0,168,232,0.5)",
    color: "#00a8e8",
  },

  sub: { marginTop: 8, color: "#9ca3af", maxWidth: 820 },

  filterPanel: {
    marginTop: 20,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  filter: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    fontWeight: 800,
    fontSize: 12,
  },

  list: { marginTop: 22, display: "grid", gap: 16 },

  card: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 22,
    padding: 18,
    backdropFilter: "blur(14px)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  route: { fontSize: 18 },
  badge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  meta: {
    marginTop: 10,
    display: "flex",
    gap: 16,
    fontSize: 14,
    color: "#cbd5e1",
    alignItems: "center",
  },

  fastPay: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    background: "rgba(0,168,232,0.18)",
    color: "#00a8e8",
  },

  bidSection: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  bidHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 8,
    color: "#9ca3af",
  },

  window: { color: "#00a8e8", fontWeight: 900 },

  bidRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: 14,
  },

  tier: {
    fontWeight: 900,
    color: "#00a8e8",
  },

  primaryBtn: {
    marginTop: 14,
    padding: "14px",
    borderRadius: 16,
    background: "linear-gradient(135deg,#00a8e8,#1fb6ff)",
    fontWeight: 900,
    color: "#001018",
    border: "none",
    cursor: "pointer",
  },

  footer: {
    padding: "26px 56px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 40,
  },
  footerInner: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
  },
  footerMuted: { color: "#9ca3af" },
};
