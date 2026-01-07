// FILE: app/terms/page.tsx
export default function TermsPage() {
  return (
    <main style={S.main}>
      <header style={S.header}>
        <a href="/" style={S.brand}>OVERSIZE ESCORT HUB</a>
        <nav style={S.nav}>
          <a href="/" style={S.navLink}>Home</a>
          <a href="/loads" style={S.navLink}>Load Boards</a>
          <a href="/pricing" style={S.navLink}>Membership</a>
          <a href="/verify" style={S.navLink}>Verification</a>
          <a href="/post-load" style={S.cta}>Post Load (FREE)</a>
        </nav>
      </header>

      <section style={S.wrap}>
        <h1 style={S.h1}>Terms of Service</h1>
        <p style={S.meta}>Last updated: {new Date().toLocaleDateString()}</p>

        <p style={S.p}>
          Oversize Escort Hub (“Platform”) provides tools for posting, browsing, and bidding on pilot escort work.
          By using the Platform, you agree to these Terms.
        </p>

        <h2 style={S.h2}>1. Marketplace Disclaimer</h2>
        <p style={S.p}>
          The Platform is a marketplace and trust layer. We are not a broker, carrier, dispatch service, or employer.
          Users are responsible for their own agreements, compliance, and performance.
        </p>

        <h2 style={S.h2}>2. Accounts & Conduct</h2>
        <ul style={S.ul}>
          <li>You must provide accurate information and keep your account secure.</li>
          <li>No harassment, threats, fraud, or misuse of the Platform.</li>
          <li>Abuse, spam, or repeated cancellations may result in restrictions or suspension.</li>
        </ul>

        <h2 style={S.h2}>3. Loads, Bids, Awards</h2>
        <ul style={S.ul}>
          <li>Posters must provide accurate load details, requirements, and pay terms.</li>
          <li>Bid Board awards follow Platform rules (timers, qualification checks, rank tie-breaks).</li>
          <li>We may remove misleading or abusive postings.</li>
        </ul>

        <h2 style={S.h2}>4. Verification</h2>
        <p style={S.p}>
          Verification may involve manual review and/or third-party confirmation. Verification reflects checks performed
          at the time and is not a guarantee of future compliance or performance.
        </p>

        <h2 style={S.h2}>5. Payments & Memberships</h2>
        <ul style={S.ul}>
          <li>Paid features are billed per your selected plan.</li>
          <li>Fees are generally non-refundable unless required by law.</li>
          <li>Chargeback abuse may result in account restriction.</li>
        </ul>

        <h2 style={S.h2}>6. Limitation of Liability</h2>
        <p style={S.p}>
          The Platform is provided “as is.” To the maximum extent allowed by law, we are not liable for lost profits,
          missed loads, disputes between users, or indirect damages.
        </p>

        <h2 style={S.h2}>7. Contact</h2>
        <p style={S.p}>
          For support or policy questions, contact Oversize Escort Hub support through your official support email.
        </p>
      </section>

      <footer style={S.footer}>
        <span>© Oversize Escort Hub</span>
        <span style={S.footerRight}>
          <a href="/about" style={S.footerLink}>About</a>
          <a href="/terms" style={S.footerLink}>Terms</a>
        </span>
      </footer>
    </main>
  );
}

const S: any = {
  main: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" },

  header: { display: "flex", justifyContent: "space-between", padding: "22px 48px", borderBottom: "1px solid rgba(255,255,255,.08)" },
  brand: { fontSize: 22, fontWeight: 900, color: "#00b4ff", textDecoration: "none", textShadow: "0 0 20px rgba(0,180,255,.35)" },
  nav: { display: "flex", gap: 16, alignItems: "center" },
  navLink: { color: "#e5e7eb", textDecoration: "none", fontWeight: 700 },
  cta: { background: "#00b4ff", color: "#001018", padding: "10px 16px", borderRadius: 12, fontWeight: 900, textDecoration: "none" },

  wrap: { padding: "48px", maxWidth: 900, margin: "0 auto" },
  h1: { fontSize: 40, fontWeight: 900, margin: 0 },
  meta: { marginTop: 10, opacity: 0.7, fontSize: 13 },
  h2: { marginTop: 26, fontSize: 20, fontWeight: 900, color: "#00b4ff" },
  p: { marginTop: 10, opacity: 0.85, lineHeight: 1.65 },
  ul: { marginTop: 10, paddingLeft: 18, opacity: 0.9, lineHeight: 1.7 },

  footer: { padding: "32px 48px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.08)", opacity: 0.75 },
  footerRight: { display: "flex", gap: 14 },
  footerLink: { color: "#e5e7eb", textDecoration: "none", fontWeight: 700 },
};
