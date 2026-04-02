export default function About() {
  return (
    <div style={{ background: "var(--bg,#0a0a0a)", minHeight: "100vh", color: "#ccc", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90", marginBottom: 10 }}>OVERSIZE ESCORT HUB</div>
          <h1 style={{ fontSize: 40, color: "#fff", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            Built by someone who<br />has driven every mile of it.
          </h1>
          <p style={{ fontSize: 15, color: "#888", maxWidth: 560 }}>
            We didn't build this platform in a conference room. We built it because we lived the problem.
          </p>
        </div>

        {/* Founder story */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 64, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".15em", color: "#f90", marginBottom: 16 }}>THE FOUNDER</div>
            <h2 style={{ fontSize: 24, color: "#fff", marginBottom: 20 }}>Brian Ahmed</h2>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              Before writing a single line of code, Brian Ahmed was out on the road — first as a truck driver hauling oversize loads across the country, and later as a licensed pilot car escort running lead and chase on some of the most complex moves in the industry.
            </p>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              He knew firsthand what it felt like to need a reliable escort and not be able to find one fast. He knew the frustration of driving hundreds of miles home empty after a run with no return load in sight. He knew the anxiety of working with strangers whose experience and equipment you couldn't verify.
            </p>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              Those experiences didn't just inform Oversize Escort Hub — they <em style={{ color: "#fff" }}>are</em> Oversize Escort Hub. Every feature on this platform exists because Brian has either felt the pain it solves or talked directly with the drivers and carriers who have.
            </p>
            <p style={{ lineHeight: 1.8 }}>
              Brian also brings a background in law enforcement, which shapes the platform's verification and background check system — designed to give both carriers and escorts the confidence that who they're working with is who they say they are.
            </p>
          </div>
          <div>
            <div style={{ background: "rgba(249,144,0,0.06)", border: "1px solid rgba(249,144,0,0.2)", borderRadius: 8, padding: 28, marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: ".15em", color: "#f90", marginBottom: 12 }}>BRIAN'S BACKGROUND</div>
              {[
                ["🚛", "Oversize Load Truck Driver"],
                ["🚗", "Licensed Pilot Car / P/EVO Escort"],
                ["🛡️", "Law Enforcement Background"],
                ["💻", "Founder & CEO, Oversize Escort Hub"],
              ].map(([icon, label]) => (
                <div key={String(label)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#ddd" }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 24 }}>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.7, fontStyle: "italic" }}>
                "I built the platform I wished existed when I was out there doing it. No middlemen, no commissions, no guessing. Just verified escorts, real loads, and a system that works the way this industry actually works."
              </div>
              <div style={{ marginTop: 16, fontSize: 10, color: "#f90", letterSpacing: ".1em" }}>— BRIAN AHMED, FOUNDER</div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 56, marginBottom: 56 }}>
          <div style={{ fontSize: 10, letterSpacing: ".15em", color: "#f90", marginBottom: 16 }}>OUR MISSION</div>
          <h2 style={{ fontSize: 28, color: "#fff", marginBottom: 24, maxWidth: 600 }}>
            A marketplace built for the people who keep oversize loads moving.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {[
              ["No Commissions", "Carriers and escorts keep 100% of what they negotiate. We charge a flat subscription — that's it."],
              ["Verified Escorts", "Every escort on the platform goes through identity verification and optional background check review by Brian personally."],
              ["Real Connections", "Direct contact between carriers and escorts. No middlemen, no dispatchers taking a cut."],
            ].map(([title, desc]) => (
              <div key={String(title)} style={{ padding: 20, background: "rgba(255,255,255,.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 10 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: ".15em", color: "#f90", marginBottom: 12 }}>GET IN TOUCH</div>
          <p style={{ marginBottom: 8 }}>Questions, partnerships, or feedback — we want to hear from you.</p>
          <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90", fontSize: 15 }}>support@oversize-escort-hub.com</a>
        </div>

      </div>
    </div>
  );
}
