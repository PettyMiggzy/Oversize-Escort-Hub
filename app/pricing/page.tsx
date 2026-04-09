"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

const PRICES = {
  member:      "price_1TF00LLmfugPCRbAl6sF0Oup",
  pro:         "price_1TF021LmfugPCRbA7CGgLhC0",
  pevo_member: "price_1TF0D4LmfugPCRbAd4hMO22R",
  pevo_pro:    "price_1TF0DiLmfugPCRbAPWsN2K5x",
  bgc:         "price_1TF0EILmfugPCRbAvM6Q5rhW",
}

async function startCheckout(priceId: string, setLoading: (v: string) => void) {
  setLoading(priceId)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = "/signin?redirect=pricing"; return }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId: session.user.id }),
    })
    const { url, error } = await res.json()
    if (error) { alert("Error: " + error); return }
    window.location.href = url
  } finally {
    setLoading("")
  }
}

function Tier({ badge, title, price, desc, points, cta, onCTA, loading, highlight }: {
  badge: string; title: string; price: string; desc: string; points: string[]
  cta: string; onCTA: () => void; loading: boolean; highlight?: boolean
}) {
  return (
    <div style={{ background: highlight ? "#111827" : "#111", border: highlight ? "2px solid #00a8e8" : "1px solid #1f2937", borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ background: highlight ? "#00a8e8" : "#1f2937", color: highlight ? "#000" : "#9ca3af", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, letterSpacing: 1, alignSelf: "flex-start" }}>{badge}</span>
      <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h2>
      <p style={{ color: "#00a8e8", fontSize: 28, fontWeight: 800, margin: 0 }}>{price}</p>
      <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>{desc}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, flexGrow: 1 }}>
        {points.map(p => <li key={p} style={{ color: "#d1d5db", fontSize: 14, display: "flex", gap: 8 }}><span style={{ color: "#00a8e8" }}>✓</span>{p}</li>)}
      </ul>
      <button onClick={onCTA} disabled={loading} style={{ background: highlight ? "#00a8e8" : "#1f2937", color: highlight ? "#000" : "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Loading..." : cta}
      </button>
    </div>
  )
}

export default function PricingPage() {
  const [loading, setLoading] = useState("")
  return (
    <main style={{ background: "#0a0a0a", color: "#ccc", fontFamily: "sans-serif", minHeight: "100vh" }}>
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ textAlign: "center", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Membership & Access</h1>
        <p style={{ textAlign: "center", color: "#9ca3af", marginBottom: 56 }}>Trial to explore. Member to compete. Pro to win.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <Tier badge="TRIAL" title="30-Day Trial" price="FREE" desc="Explore the platform and understand how the hub works."
            points={["Profile required to view boards","View load listings","Cannot see contact info","One trial per device"]}
            cta="Start Free Trial" onCTA={() => window.location.href = "/signin"} loading={false} />
          <Tier badge="MEMBER" title="Member" price="$19.99/mo" desc="Compete for loads. See contact info. Get in the game."
            points={["Everything in Trial","See carrier contact info","Bid on open loads","Priority listing visibility"]}
            cta="Get Member" onCTA={() => startCheckout(PRICES.member, setLoading)} loading={loading === PRICES.member} highlight />
          <Tier badge="PRO" title="Pro" price="$29.99/mo" desc="Stop Driving Home Empty. The deadhead minimizer alone pays for this."
            cta="Go Pro" onCTA={() => startCheckout(PRICES.pro, setLoading)} loading={loading === PRICES.pro}
          points={["Deadhead Minimizer (save $4,800/yr avg)", "Real-time SMS load alerts", "Bid board access — Pro gets instant alerts", "Priority search placement", "Pro badge on profile", "Fleet Manager Tools — manage up to 5 escorts", "NWS weather alerts on load cards"]} />
        </div>
        <div style={{ marginTop: 48, background: "#111", border: "1px solid #1f2937", borderRadius: 12, padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <span style={{ background: "#1d4ed8", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>BACKGROUND CHECK</span>
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "12px 0 6px" }}>Verified Badge — $14.99</h3>
            <p style={{ color: "#9ca3af", fontSize: 14, maxWidth: 520 }}>One-time fee. Submit your PDF, Brian reviews manually. Badge appears on your profile upon approval.</p>
          </div>
          <button onClick={() => startCheckout(PRICES.bgc, setLoading)} disabled={loading === PRICES.bgc}
            style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading === PRICES.bgc ? 0.6 : 1 }}>
            {loading === PRICES.bgc ? "Loading..." : "Get Verified — $14.99"}
          </button>
        </div>
      </section>
    </main>
  )
}
