"use client"
import Link from "next/link"

const TIERS = [
  {
    name: "Free",
    badge: "FREE",
    badgeColor: "#555",
    description: "Create your profile and get listed in the Find Escorts directory. Carriers can view your profile and contact you.",
    features: ["Listed in Find Escorts", "Basic profile", "Contact form visible"],
    price: null,
    action: "Get Started Free",
    href: "/join",
  },
  {
    name: "BGC Verified",
    badge: "BGC ✓",
    badgeColor: "#22c55e",
    description: "Background check verification adds a trust badge to your profile, making carriers 3x more likely to hire you.",
    features: ["BGC badge on profile", "Priority listing", "Verified checkmark"],
    price: "$9.99",
    priceNote: "one-time fee",
    action: "Start Verification",
    href: "/verify/bgc",
  },
  {
    name: "Pro Member",
    badge: "PRO",
    badgeColor: "#f59e0b",
    description: "Unlock bid alerts, unlimited load applications, SMS notifications, and priority placement in search results.",
    features: ["All BGC features", "Bid board access", "SMS load alerts", "Priority search placement", "Pro badge"],
    price: "$19/mo",
    priceNote: "or $149/yr",
    action: "Go Pro",
    href: "/pricing",
  },
  {
    name: "Carrier Member",
    badge: "CARRIER",
    badgeColor: "#ff6600",
    description: "Post unlimited loads, access the full escort directory, and manage your fleet operations from one dashboard.",
    features: ["Post unlimited loads", "Full escort directory", "Carrier dashboard", "Match notifications", "Load analytics"],
    price: "$29/mo",
    priceNote: "or $249/yr",
    action: "Become a Carrier",
    href: "/pricing",
  },
]

export default function VerifyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "sans-serif" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #111 0%, #1a0a00 100%)", padding: "60px 24px 48px", textAlign: "center", borderBottom: "1px solid #ff6600/20" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p style={{ color: "#ff6600", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>OEH VERIFICATION</p>
          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
            Build Trust.<br />
            <span style={{ color: "#ff6600" }}>Get More Loads.</span>
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 17, maxWidth: 500, margin: "0 auto" }}>
            Verified escorts earn more. Carriers trust verified profiles. Start with free, upgrade when you are ready.
          </p>
        </div>
      </div>

      {/* Tier Cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: "#111",
                border: "1px solid #222",
                borderLeft: `4px solid ${tier.badgeColor}`,
                borderRadius: 12,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{
                  background: tier.badgeColor,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}>
                  {tier.badge}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{tier.name}</span>
              </div>
              <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                {tier.description}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: "#d1d5db", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: tier.badgeColor, fontSize: 14 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {tier.price && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: "#ff6600" }}>{tier.price}</span>
                  {tier.priceNote && <span style={{ fontSize: 13, color: "#9ca3af", marginLeft: 6 }}>{tier.priceNote}</span>}
                </div>
              )}
              <Link
                href={tier.href}
                style={{
                  display: "block",
                  background: "#ff6600",
                  color: "#fff",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
              >
                {tier.action}
              </Link>
            </div>
          ))}
        </div>

        {/* DD-214 Veteran Discount */}
        <div style={{
          marginTop: 56,
          background: "#111",
          border: "1px solid #1e3a5f",
          borderLeft: "4px solid #3b82f6",
          borderRadius: 12,
          padding: "32px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>🎖️</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Veteran Discount — DD-214 Submission</h2>
          </div>
          <p style={{ color: "#9ca3af", marginBottom: 20, lineHeight: 1.6 }}>
            We honor those who have served. Veterans with a valid DD-214 receive 50% off any paid plan. Upload your DD-214 below and our team will verify and apply your discount within 24 hours.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <input
              type="email"
              placeholder="Your email address"
              style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "10px 14px", borderRadius: 6, fontSize: 14, flex: 1, minWidth: 200 }}
            />
            <label style={{
              display: "inline-block",
              background: "#3b82f6",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}>
              📎 Upload DD-214
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} />
            </label>
            <button style={{
              background: "#ff6600",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}>
              Submit for Review
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
            Your document is kept confidential and deleted after verification. We accept PDF, JPG, or PNG.
          </p>
        </div>
      </div>
    </main>
  )
}
