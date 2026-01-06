export default function PostLoadPage() {
  return (
    <main style={S.main}>
      <Header />

      <section style={S.wrap}>
        <h1 style={S.h1}>Post a Load (FREE)</h1>
        <p style={S.sub}>
          Brokers, carriers, and drivers can post unlimited loads at no cost.
          Escorts will only bid on complete, clear postings.
        </p>

        <div style={S.panel}>
          <form style={S.form}>
            {/* LOAD INFO */}
            <Section title="Load Details" />
            <Grid>
              <Input label="Pickup City" required />
              <Input label="Pickup State" required />
              <Input label="Pickup ZIP" required />
              <Input label="Drop-off City" required />
              <Input label="Drop-off State" required />
              <Input label="Drop-off ZIP" required />
            </Grid>

            <Grid>
              <Input label="Estimated Miles" required />
              <Input label="Load Date (MM/DD/YYYY)" required />
              <Select
                label="Escort Position Needed"
                options={[
                  "Lead",
                  "Escort",
                  "High Pole",
                  "Route Survey",
                  "Steer / Tiller",
                ]}
              />
              <Select
                label="Board Type"
                options={[
                  "Regular Load Board",
                  "Bid Board (5-minute window)",
                ]}
              />
            </Grid>

            {/* PAY TERMS */}
            <Section title="Pay Terms" />
            <Grid>
              <Select
                label="Pay Timeframe"
                options={[
                  "Fast Pay (within 10 business days)",
                  "7 Days",
                  "10 Days",
                  "Custom",
                ]}
              />
              <Input label="Max $ / Mile (Bid Board)" />
              <Input label="Overnight Rate ($100 recommended)" />
              <Input label="No-Go Fee ($300 recommended)" />
            </Grid>

            {/* SPECIAL REQUIREMENTS */}
            <Section title="Special Requirements (Optional)" />
            <Grid>
              <Check label="WITPAC / NY Certified" />
              <Check label="Passport Required (Canada)" />
              <Check label="Quick Pay Preferred" />
            </Grid>

            {/* CONTACT */}
            <Section title="Contact Method" />
            <Grid>
              <Input label="Company / Contact Name" required />
              <Input label="Phone Number" required />
              <Input label="Email Address" required />
            </Grid>

            <div style={S.notice}>
              Escorts are responsible for carrying proper insurance.
              This platform connects parties — agreements are between escort
              and company.
            </div>

            <button style={S.primaryBtn}>POST LOAD FREE</button>
          </form>
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
        <a style={S.navLink} href="/pricing">Membership</a>
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

function Section({ title }: { title: string }) {
  return <div style={S.sectionTitle}>{title}</div>;
}

function Grid({ children }: { children: any }) {
  return <div style={S.grid}>{children}</div>;
}

function Input({ label, required }: any) {
  return (
    <div style={S.field}>
      <label style={S.label}>
        {label} {required && "*"}
      </label>
      <input style={S.input} />
    </div>
  );
}

function Select({ label, options }: any) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <select style={S.input}>
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Check({ label }: any) {
  return (
    <label style={S.check}>
      <input type="checkbox" /> {label}
    </label>
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

  wrap: { padding: "40px 56px" },
  h1: { fontSize: 40, fontWeight: 900 },
  sub: { marginTop: 8, color: "#9ca3af" },

  panel: {
    marginTop: 24,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 24,
  },

  form: { display: "grid", gap: 22 },
  sectionTitle: {
    fontWeight: 900,
    color: "#00a8e8",
    marginTop: 10,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
  },

  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700 },
  input: {
    padding: "12px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
  },

  check: { fontSize: 14 },

  notice: {
    fontSize: 12,
    color: "#9ca3af",
    borderLeft: "3px solid #00a8e8",
    paddingLeft: 10,
  },

  primaryBtn: {
    marginTop: 20,
    padding: "16px",
    borderRadius: 16,
    background: "linear-gradient(135deg,#00a8e8,#1fb6ff)",
    fontWeight: 900,
    color: "#001018",
    border: "none",
    cursor: "pointer",
  },

  footer: {
    padding: "30px 56px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 40,
  },
  footerInner: { display: "flex", justifyContent: "space-between" },
  footerMuted: { fontSize: 13, color: "#9ca3af" },
  footerLinks: { display: "flex", gap: 16 },
  footerLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },
};
