"use client"
import { useState } from "react"
import Header from "@/components/SiteHeader"
import Footer from "@/components/SiteFooter"
import Link from "next/link"

const TIERS = [
  {
    id: "free",
    name: "Free Tier",
    badge: "FREE",
    badgeColor: "#6b7280",
    price: null,
    description: "Create your profile and appear in search results. Basic visibility with no verification badge.",
    features: ["Profile listing", "Appear in Find Escorts", "Contact form", "Basic bio & photos"],
    cta: "Get Started Free",
    ctaHref: "/signin",
  },
  {
    id: "member",
    name: "Member Verified",
    badge: "MEMBER",
    badgeColor: "#3b82f6",
    price: null,
    description: "Identity verified by OEH staff. Member badge on your profile. Required before BGC upgrade.",
    features: ["Everything in Free", "OEH Member badge", "Priority in search", "Verified identity on profile"],
    cta: "Start Verification",
    ctaHref: "/signin",
  },
  {
    id: "bgc",
    name: "BGC Verified",
    badge: "BGC",
    badgeColor: "#f59e0b",
    price: "$9.99",
    description: "Full background check through our trusted partner. Gold BGC badge signals to carriers you are trustworthy.",
    features: ["Everything in Member", "Gold BGC badge", "Background check certificate", "Highest trust ranking"],
    cta: "Start BGC — $9.99",
    ctaHref: "/pricing",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro Verified",
    badge: "PRO",
    badgeColor: "#ff6600",
    price: null,
    description: "For top escorts who have completed BGC and have demonstrated excellence on the platform.",
    features: ["Everything in BGC", "Orange PRO badge", "Featured in top results", "Pro escort directory"],
    cta: "Upgrade to Pro",
    ctaHref: "/pricing",
  },
]

export default function VerificationPage() {
  const [ddForm, setDdForm] = useState({ name: "", email: "", branch: "", years: "", file: null as File | null })
  const [ddSubmitted, setDdSubmitted] = useState(false)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg,#0d0d0d)", color: "#eee", fontFamily: "var(--font,sans-serif)" }}>
      <Header />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#1a1a1a 0%,#111 100%)", borderBottom: "1px solid rgba(255,102,0,0.2)", padding: "60px 20px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", background: "rgba(255,102,0,0.12)", border: "1px solid rgba(255,102,0,0.3)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#ff6600", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
            Trust & Safety
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 16, lineHeight: 1.2 }}>
            OEH Verification Program
          </h1>
          <p style={{ fontSize: 16, color: "#9ca3af", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Carriers trust verified escorts. Build credibility, earn more loads, and stand out from the crowd with an OEH verification badge.
          </p>
        </div>
      </div>

      {/* Tier Cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {TIERS.map(tier => (
            <div key={tier.id} style={{
              background: "var(--card,#111)",
              border: tier.highlight ? "1px solid rgba(255,102,0,0.4)" : "1px solid rgba(255,255,255,0.07)",
              borderLeft: `4px solid ${tier.badgeColor}`,
              borderRadius: 14,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              boxShadow: tier.highlight ? "0 0 32px rgba(255,102,0,0.08)" : "none",
            }}>
              {tier.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#ff6600", color: "#000", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>
                  Most Popular
                </div>
              )}
              {/* Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ background: tier.badgeColor + "22", border: `1px solid ${tier.badgeColor}44`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 800, color: tier.badgeColor, letterSpacing: 1 }}>
                  {tier.badge}
                </div>
                {tier.price && (
                  <div style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                    {tier.price}
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{tier.name}</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6, marginBottom: 20, flexGrow: 1 }}>{tier.description}</p>

              {/* Features */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0" }}>
                {tier.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#d1d5db", marginBottom: 8 }}>
                    <span style={{ color: tier.badgeColor, fontSize: 14, fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={tier.ctaHref}>
                <button style={{
                  width: "100%",
                  padding: "12px 0",
                  background: tier.highlight ? "#ff6600" : "transparent",
                  color: tier.highlight ? "#000" : "#ff6600",
                  border: `1px solid ${tier.highlight ? "#ff6600" : "rgba(255,102,0,0.4)"}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  {tier.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "56px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 40 }}>
            How Verification Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {[
              { step: "1", title: "Create Account", body: "Sign up as an escort on OEH. Your profile is automatically created at the Free tier." },
              { step: "2", title: "Submit Documents", body: "Upload your ID and state certification documents through the secure verification portal." },
              { step: "3", title: "Staff Review", body: "OEH staff manually reviews your submission. Most verifications complete within 48 hours." },
              { step: "4", title: "Badge Applied", body: "Once approved, your badge appears on your profile and in all escort search listings." },
            ].map(item => (
              <div key={item.step} style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,102,0,0.15)", border: "2px solid rgba(255,102,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#ff6600", margin: "0 auto 16px" }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DD-214 Veteran Discount */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "56px 20px" }}>
        <div style={{
          background: "var(--card,#111)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderLeft: "4px solid #ff6600",
          borderRadius: 14,
          padding: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>🎖️</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Veteran Discount — DD-214</h2>
          </div>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24, lineHeight: 1.7 }}>
            Thank you for your service. Veterans with a valid DD-214 receive a <strong style={{ color: "#ff6600" }}>free BGC upgrade</strong>. Submit your DD-214 below and our team will apply the discount to your account within 24 hours.
          </p>

          {ddSubmitted ? (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "16px 20px", color: "#22c55e", fontWeight: 600, textAlign: "center" }}>
              ✓ Your DD-214 discount request has been submitted. We will review and apply within 24 hours.
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setDdSubmitted(true) }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>Full Name</label>
                  <input type="text" required value={ddForm.name} onChange={e => setDdForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>Account Email</label>
                  <input type="email" required value={ddForm.email} onChange={e => setDdForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, boxSizing: "border-box" as const }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>Branch of Service</label>
                  <input type="text" value={ddForm.branch} onChange={e => setDdForm(f => ({ ...f, branch: e.target.value }))}
                    placeholder="e.g. Army, Navy" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>Years of Service</label>
                  <input type="text" value={ddForm.years} onChange={e => setDdForm(f => ({ ...f, years: e.target.value }))}
                    placeholder="e.g. 2010-2018" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, boxSizing: "border-box" as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>DD-214 Document (PDF or image)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDdForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#9ca3af", fontSize: 13 }} />
              </div>
              <button type="submit" style={{ padding: "12px", background: "#ff6600", color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Submit DD-214 for Free BGC
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
