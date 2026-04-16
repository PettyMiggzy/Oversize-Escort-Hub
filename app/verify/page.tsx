"use client"
import { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verification | Oversize Escort Hub',
  description: 'Get verified with a BGC badge or upload your DD-214 for a veteran discount on OEH.',
  openGraph: {
    title: 'Verification | Oversize Escort Hub',
    description: 'Get verified with a BGC badge or upload your DD-214 for a veteran discount on OEH.',
    url: 'https://www.oversize-escort-hub.com/verify',
    siteName: 'Oversize Escort Hub',
  },
}



const TIERS = [
  {
    tier: 1,
    name: "P/EVO State Cert",
    badge: "TIER 1",
    badgeColor: "#22c55e",
    description: "Upload your state P/EVO certification document. Our team reviews within 24 hours and adds a verified badge to your profile.",
    features: ["State cert badge on profile", "Priority search listing", "Verified checkmark"],
    price: null,
    docLabel: "Upload Cert PDF",
    accept: ".pdf,.jpg,.jpeg,.png",
    apiPath: "/api/verify-doc",
    tier_key: "tier1",
  },
  {
    tier: 2,
    name: "Vehicle & Insurance",
    badge: "TIER 2",
    badgeColor: "#3b82f6",
    description: "Upload your vehicle registration and proof of insurance. Unlocks full carrier trust and premium load access.",
    features: ["Vehicle verified badge", "Insurance verified badge", "Higher carrier trust score"],
    price: null,
    docLabel: "Upload Vehicle/Insurance Docs",
    accept: ".pdf,.jpg,.jpeg,.png",
    apiPath: "/api/verify-doc",
    tier_key: "tier2",
  },
  {
    tier: 3,
    name: "Background Check",
    badge: "TIER 3",
    badgeColor: "#f59e0b",
    description: "Complete a background check for the highest trust level. One-time $9.99 fee.",
    features: ["BGC badge on profile", "Top search placement", "Pro badge + SMS alerts"],
    price: "$9.99",
    priceNote: "one-time fee",
    stripePrice: "price_1TF0EILmfugPCRbAvM6Q5rhW",
    tier_key: "tier3",
  },
  {
    tier: 4,
    name: "DD-214 Veteran",
    badge: "TIER 4",
    badgeColor: "#ff6600",
    description: "Upload your DD-214 to verify veteran status. Unlock the Veteran Discount when it becomes available.",
    features: ["Veteran verified badge", "Veteran Discount - Coming Soon", "Priority support"],
    price: null,
    docLabel: "Upload DD-214",
    accept: ".pdf,.jpg,.jpeg,.png",
    apiPath: "/api/verify-doc",
    tier_key: "tier4",
  },
]

function TierFeatures({ features, color }: { features: string[]; color: string }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      {features.map((f) => (
        <li key={f} style={{ fontSize: 13, color: "#d1d5db", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color, fontSize: 14 }}>&#10003;</span>
          {f}
        </li>
      ))}
    </ul>
  )
}

function UploadTierCard({ t }: { t: typeof TIERS[0] }) {
  const ref = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function handleSubmit() {
    const file = ref.current?.files?.[0]
    if (!file) { setMsg("Please select a file first."); return }
    setStatus("uploading"); setMsg("")
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id ?? "anonymous"
    const fd = new FormData()
    fd.append("file", file)
    fd.append("userId", userId)
    fd.append("tier", t.tier_key!)
    try {
      const res = await fetch(t.apiPath!, { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")
      setStatus("done"); setMsg("Submitted! Our team will review within 24 hours.")
    } catch (e: any) {
      setStatus("error"); setMsg("Error: " + (e.message || "Something went wrong"))
    }
  }

  return (
    <div style={{ background: "#111", border: "1px solid #222", borderLeft: `4px solid ${t.badgeColor}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ background: t.badgeColor, color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "3px 8px", borderRadius: 4 }}>{t.badge}</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{t.name}</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{t.description}</p>
      <TierFeatures features={t.features} color={t.badgeColor} />
      {status !== "done" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "block", background: "#1a1a1a", border: "1px dashed #444", color: "#9ca3af", padding: "10px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", textAlign: "center" }}>
            {t.docLabel}
            <input ref={ref} type="file" accept={t.accept} style={{ display: "none" }} />
          </label>
          <button onClick={handleSubmit} disabled={status === "uploading"} style={{ background: status === "uploading" ? "#555" : t.badgeColor, color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: status === "uploading" ? "not-allowed" : "pointer" }}>
            {status === "uploading" ? "Uploading..." : "Start Verification"}
          </button>
        </div>
      ) : null}
      {msg && <p style={{ fontSize: 13, color: status === "done" ? "#22c55e" : "#ef4444", marginTop: 10 }}>{msg}</p>}
    </div>
  )
}

function StripeTierCard({ t }: { t: typeof TIERS[2] }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch("/api/bgc-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id ?? "", email: session?.user?.email ?? "" }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#111", border: "1px solid #222", borderLeft: `4px solid ${t.badgeColor}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ background: t.badgeColor, color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "3px 8px", borderRadius: 4 }}>{t.badge}</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{t.name}</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{t.description}</p>
      <TierFeatures features={t.features} color={t.badgeColor} />
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#ff6600" }}>{t.price}</span>
        <span style={{ fontSize: 13, color: "#9ca3af", marginLeft: 6 }}>{t.priceNote}</span>
      </div>
      <button onClick={handleCheckout} disabled={loading} style={{ background: loading ? "#555" : t.badgeColor, color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Redirecting..." : "Get BGC Badge"}
      </button>
    </div>
  )
}

function DD214TierCard({ t }: { t: typeof TIERS[3] }) {
  const ref = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function handleSubmit() {
    const file = ref.current?.files?.[0]
    if (!file) { setStatus("error"); setMsg("Please select a file."); return }
    setStatus("uploading")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fd = new FormData()
      fd.append("file", file)
      fd.append("userId", session?.user?.id ?? "")
      fd.append("tier", t.tier_key!)
      const res = await fetch(t.apiPath!, { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")
      setStatus("done"); setMsg("DD-214 submitted! Our team will verify within 24 hours.")
    } catch (e: any) {
      setStatus("error"); setMsg(e.message || "Upload failed")
    }
  }

  return (
    <div style={{ background: "#111", border: "1px solid #222", borderLeft: `4px solid ${t.badgeColor}`, borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ background: t.badgeColor, color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: "3px 8px", borderRadius: 4 }}>{t.badge}</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{t.name}</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{t.description}</p>
      <TierFeatures features={t.features} color={t.badgeColor} />
      <div style={{ background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ff9966" }}>
        Veteran Discount - Coming Soon
      </div>
      {status === "done" ? (
        <div style={{ color: "#22c55e", fontSize: 14, fontWeight: 600 }}>{msg}</div>
      ) : (
        <>
          <label style={{ background: "#222", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "#9ca3af", marginBottom: 10, textAlign: "center" }}>
            {ref.current?.files?.[0]?.name || t.docLabel}
            <input ref={ref} type="file" accept={t.accept} style={{ display: "none" }} onChange={() => setMsg("")} />
          </label>
          {msg && <p style={{ color: status === "error" ? "#ef4444" : "#22c55e", fontSize: 13, marginBottom: 8 }}>{msg}</p>}
          <button onClick={handleSubmit} disabled={status === "uploading"} style={{ background: status === "uploading" ? "#555" : t.badgeColor, color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: status === "uploading" ? "not-allowed" : "pointer" }}>
            {status === "uploading" ? "Uploading..." : "Upload DD-214"}
          </button>
        </>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0d0d0d", color: "#fff", fontFamily: "sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #111 0%, #1a0a00 100%)", padding: "60px 24px 48px", textAlign: "center", borderBottom: "1px solid rgba(255,102,0,0.2)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p style={{ color: "#ff6600", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>OEH VERIFICATION</p>
          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
            Build Trust. Get More Loads.
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 17, maxWidth: 500, margin: "0 auto" }}>
            Verified escorts earn more. Complete each tier to unlock the next.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          <UploadTierCard t={TIERS[0] as any} />
          <UploadTierCard t={TIERS[1] as any} />
          <StripeTierCard t={TIERS[2] as any} />
          <DD214TierCard t={TIERS[3] as any} />
        </div>
      </div>
    </main>
  )
          }
