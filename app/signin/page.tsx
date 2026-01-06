// FILE: app/signin/page.tsx
// ACTION: Replace ENTIRE file

export default function SignInPage() {
  return (
    <main style={S.main}>
      <Header />

      <section style={S.wrap}>
        <div style={S.card}>
          <h1 style={S.h1}>Access the Hub</h1>
          <p style={S.sub}>
            All users must create an account to interact with the platform.
            Email is required. Phone number is required for notifications,
            enforcement, and account security.
          </p>

          {/* ===== SIGN IN / SIGN UP ===== */}
          <form style={S.form}>
            <Field label="Email Address">
              <input type="email" style={S.input} required />
            </Field>

            <Field label="Mobile Phone Number">
              <input
                type="tel"
                style={S.input}
                placeholder="No prepaid / VoIP numbers"
                required
              />
            </Field>

            <Field label="Account Type">
              <select style={S.input}>
                <option>Pilot Escort (Individual)</option>
                <option>Pilot Escort Company</option>
                <option>Broker / Carrier</option>
                <option>Oversize Driver</option>
              </select>
            </Field>

            <div style={S.notice}>
              By continuing, you authorize Oversize Escort Hub to communicate
              via email and SMS. Phone numbers are used for alerts and account
              enforcement.
            </div>

            <button style={S.primaryBtn}>CONTINUE</button>
          </form>

          {/* ===== COMING SOON ===== */}
          <div style={S.comingSoon}>
            <div style={S.csTitle}>Coming Soon</div>
            <div style={S.csRow}>
              <span>📱 iOS App</span>
              <span>🤖 Android App</span>
              <span>⚡ FastPay Invoicing</span>
              <span>🧾 Factoring</span>
            </div>
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
        <a style={S.navLink} href="/pricing">Membership</a>
        <a style={S.navLink} href="/verify">Verification</a>
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

function Field({ label, children }: any) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      {children}
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

  wrap: {
    padding: "60px 56px",
    display: "flex",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 26,
    padding: 28,
    backdropFilter: "blur(16px)",
  },

  h1: { margin: 0, fontSize: 34, fontWeight: 900 },
  sub: { marginTop: 8, fontSize: 14, color: "#9ca3af" },

  form: { marginTop: 22, display: "grid", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 800 },

  input: {
    padding: "14px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: 14,
  },

  notice: {
    fontSize: 12,
    color: "#9ca3af",
    borderLeft: "3px solid #00a8e8",
    paddingLeft: 10,
  },

  primaryBtn: {
    marginTop: 10,
    padding: "16px",
    borderRadius: 16,
    background: "linear-gradient(135deg,#00a8e8,#1fb6ff)",
    fontWeight: 900,
    color: "#001018",
    border: "none",
    cursor: "pointer",
  },

  comingSoon: {
    marginTop: 26,
    paddingTop: 18,
    borderTop: "1px solid rgba(255,255,255,0.12)",
  },
  csTitle: {
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: 1.2,
    color: "#00a8e8",
    marginBottom: 10,
  },
  csRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 13,
    color: "#cbd5e1",
    fontWeight: 700,
  },

  footer: {
    padding: "30px 56px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 60,
  },
  footerInner: { display: "flex", justifyContent: "space-between" },
  footerMuted: { fontSize: 13, color: "#9ca3af" },
  footerLinks: { display: "flex", gap: 16 },
  footerLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },
};
