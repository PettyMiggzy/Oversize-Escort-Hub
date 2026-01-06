// FILE: app/verify/page.tsx
// ACTION: Replace ENTIRE file

export default function VerifyPage() {
  return (
    <main style={S.main}>
      <Header />

      <section style={S.wrap}>
        <h1 style={S.h1}>Verification & Trust Layer</h1>
        <p style={S.sub}>
          Verification increases trust, win rate, and platform standing.  
          Optional — but strongly recommended.
        </p>

        {/* ===== BADGES ===== */}
        <div style={S.grid4}>
          <Badge
            title="TRIAL"
            desc="Viewing access during trial period"
          />
          <Badge
            title="MEMBER"
            desc="Active escort with bidding access"
          />
          <Badge
            title="PRO"
            desc="Priority access & SMS alerts"
          />
          <Badge
            title="✔ VERIFIED"
            desc="Certifications reviewed & confirmed"
            glow
          />
        </div>

        {/* ===== VERIFICATION OPTIONS ===== */}
        <div style={S.panel}>
          <h2 style={S.h2}>Certification Verification</h2>
          <p style={S.text}>
            Where possible, certifications are verified with issuing entities
            and randomly re-checked for compliance.
          </p>

          <ul style={S.list}>
            <li>• Initial certification verification: <strong>$9.99</strong></li>
            <li>• Additional certificates: <strong>$3.99 each</strong></li>
            <li>• Pro members receive discounted rates</li>
            <li>• Money-back guarantee if verification cannot be completed</li>
          </ul>

          <a href="/signin" style={S.primaryBtn}>
            REQUEST VERIFICATION
          </a>
        </div>

        {/* ===== INSURANCE ===== */}
        <div style={S.panel}>
          <h2 style={S.h2}>Insurance Awareness</h2>
          <p style={S.text}>
            Escorts are responsible for maintaining proper insurance.  
            Oversize Escort Hub does not provide insurance — but highlights
            recommended coverage to posting parties.
          </p>

          <ul style={S.list}>
            <li>• Commercial Automotive Insurance</li>
            <li>• General Liability Insurance</li>
            <li>• Professional E&O (Errors & Omissions)</li>
          </ul>

          <div style={S.notice}>
            Insurance verification may or may not be possible depending on
            provider access. Visibility is provided where available.
          </div>
        </div>

        {/* ===== REVIEWS ===== */}
        <div style={S.panel}>
          <h2 style={S.h2}>Reviews & Ranking</h2>
          <p style={S.text}>
            Escorts and posting parties review each other after completed work.
            Reviews contribute to an internal ranking system used for tie-breaks.
          </p>

          <ul style={S.list}>
            <li>• One bad review does NOT drop tier</li>
            <li>• Ranking uses a private point system</li>
            <li>• Repeated no-shows or cancellations reduce access</li>
            <li>• Transparency without public shaming</li>
          </ul>
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
        <a style={S.navLink} href="/pricing">Membership</a>
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
            verification@oversize-escort-hub.com
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

function Badge({ title, desc, glow }: any) {
  return (
    <div
      style={{
        ...S.badgeCard,
        boxShadow: glow ? "0 0 30px rgba(0,168,232,0.35)" : "none",
        borderColor: glow ? "rgba(0,168,232,0.6)" : S.badgeCard.border,
      }}
    >
      <div style={S.badgeTitle}>{title}</div>
      <div style={S.badgeDesc}>{desc}</div>
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
  h2: { margin: "0 0 6px", fontSize: 28, fontWeight: 900 },
  sub: { marginTop: 8, color: "#9ca3af", maxWidth: 760 },

  grid4: {
    marginTop: 26,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 16,
  },

  badgeCard: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 22,
    padding: 22,
    backdropFilter: "blur(14px)",
    textAlign: "center",
  },
  badgeTitle: { fontWeight: 950, fontSize: 18, color: "#00a8e8" },
  badgeDesc: { marginTop: 6, fontSize: 14, color: "#9ca3af" },

  panel: {
    marginTop: 36,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 22,
  },

  text: { marginTop: 6, fontSize: 15, color: "#cbd5e1", maxWidth: 860 },
  list: { marginTop: 12, lineHeight: 1.8 },

  notice: {
    marginTop: 14,
    fontSize: 12,
    color: "#9ca3af",
    borderLeft: "3px solid #00a8e8",
    paddingLeft: 10,
  },

  primaryBtn: {
    display: "inline-block",
    marginTop: 16,
    padding: "14px 20px",
    borderRadius: 16,
    background: "linear-gradient(135deg,#00a8e8,#1fb6ff)",
    fontWeight: 900,
    color: "#001018",
    textDecoration: "none",
    boxShadow: "0 14px 30px rgba(0,168,232,0.25)",
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
