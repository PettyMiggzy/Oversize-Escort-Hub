// FILE: app/about/page.tsx
export default function AboutPage() {
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
        <h1 style={S.h1}>About Oversize Escort Hub</h1>
        <p style={S.lead}>
          Oversize Escort Hub is a live, ranked marketplace built specifically for P/EVO work.
          We’re building a platform that makes it easier to cover loads, verify professionalism,
          and award work fairly—without the old load-board chaos.
        </p>

        <div style={S.grid}>
          <Card
            title="Marketplace First"
            text="A real operating system for escorts, brokers, and carriers—built for speed and clarity."
            bullets={[
              "Clean posting requirements",
              "Fast decisions and coverage",
              "Mobile-first experience",
            ]}
          />
          <Card
            title="Fair Bidding"
            text="The Bid Board slows down “snatch” behavior and awards jobs through a timed, competitive window."
            bullets={[
              "Timed auction windows",
              "Lowest reasonable qualified bid wins",
              "Tie-breaks by rank/reliability",
            ]}
          />
          <Card
            title="Trust + Accountability"
            text="Profiles, reviews, and trust signals help good operators stand out—and reduce risk for everyone."
            bullets={[
              "Two-way reviews",
              "Reliability-based ranking",
              "Cooldowns for repeated cancellations",
            ]}
          />
          <Card
            title="Verification Layer"
            text="Optional verification helps brokers and carriers hire with confidence."
            bullets={[
              "Certification checks (where possible)",
              "Insurance checks when available",
              "Clear status: Pending / Verified",
            ]}
          />
        </div>

        <div style={S.note}>
          <strong>Verification timing:</strong> Some checks require contacting issuers or reviewing documents.
          Verification may not be instant.
        </div>
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

function Card({ title, text, bullets }: any) {
  return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>{title}</h3>
      <p style={S.cardText}>{text}</p>
      <ul style={S.list}>
        {bullets.map((b: string) => <li key={b}>{b}</li>)}
      </ul>
    </div>
  );
}

const S: any = {
  main: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" },

  header: { display: "flex", justifyContent: "space-between", padding: "22px 48px", borderBottom: "1px solid rgba(255,255,255,.08)" },
  brand: { fontSize: 22, fontWeight: 900, color: "#00b4ff", textDecoration: "none", textShadow: "0 0 20px rgba(0,180,255,.35)" },
  nav: { display: "flex", gap: 16, alignItems: "center" },
  navLink: { color: "#e5e7eb", textDecoration: "none", fontWeight: 700 },
  cta: { background: "#00b4ff", color: "#001018", padding: "10px 16px", borderRadius: 12, fontWeight: 900, textDecoration: "none" },

  wrap: { padding: "48px", maxWidth: 1100, margin: "0 auto" },
  h1: { fontSize: 40, fontWeight: 900, margin: 0 },
  lead: { marginTop: 12, fontSize: 18, opacity: 0.85, lineHeight: 1.6 },

  grid: { marginTop: 22, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 },
  card: { border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 18, background: "rgba(255,255,255,.02)" },
  cardTitle: { color: "#00b4ff", fontWeight: 900, margin: 0 },
  cardText: { marginTop: 8, opacity: 0.8, lineHeight: 1.55 },
  list: { marginTop: 10, paddingLeft: 18, opacity: 0.9 },

  note: { marginTop: 22, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,180,255,.06)" },

  footer: { padding: "32px 48px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.08)", opacity: 0.75 },
  footerRight: { display: "flex", gap: 14 },
  footerLink: { color: "#e5e7eb", textDecoration: "none", fontWeight: 700 },
};
