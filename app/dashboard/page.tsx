"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import Header from "@/components/SiteHeader"
import Footer from "@/components/SiteFooter"

const S = {
  page: { minHeight: "100vh", background: "var(--bg)", color: "#eee", fontFamily: "var(--font)" },
  hero: { background: "linear-gradient(135deg,#1a1a1a 0%,#111 100%)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "40px 20px 32px" },
  heroInner: { maxWidth: 1100, margin: "0 auto" },
  h1: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 },
  sub: { color: "#9ca3af", fontSize: 14 },
  section: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px" },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "10px 14px", color: "#9ca3af", fontSize: 11, textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  td: { padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e0e0e0", verticalAlign: "middle" as const },
  badge: (color: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + "22", color }),
  btnPrime: { background: "#00a8e8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, minHeight: 36 },
  btnGhost: { background: "transparent", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, minHeight: 36 },
  card: { background: "var(--card,#111)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20, marginBottom: 16 },
  statCard: { background: "var(--card,#111)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px", textAlign: "center" as const },
  statNum: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6b7280" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 24 },
  perkCard: { background: "var(--card,#111)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid var(--or,#f60)", borderRadius: 10, padding: 20 },
  perkTitle: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 },
  perkBody: { fontSize: 13, color: "#9ca3af", lineHeight: 1.6, marginBottom: 12 },
  comingSoon: { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "#6b7280", marginLeft: 6 },
}

type Profile = { full_name?: string; role?: string }

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<"active"|"requests"|"history">("active")
  const [activeLoads, setActiveLoads] = useState<any[]>([])
  const [matchRequests, setMatchRequests] = useState<any[]>([])
  const [historyLoads, setHistoryLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:"gr"|"rd"|"am"}|null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState({ open: 0, pending: 0, filled: 0 })
  const [savedEscorts, setSavedEscorts] = useState<any[]>([])

  const role = profile?.role ?? ""
  const isCarrier = role === "carrier"
  const isEscort = role === "escort"

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { setLoading(false); return }
      const u = data.session.user as User
      setUser(u)
      supabase.from("profiles").select("*").eq("id", u.id).single().then(({ data: p }) => {
        setProfile(p)
        loadData(u, p?.role ?? "")
      })
    })
  }, [])

  const showToast = (msg: string, type: "gr"|"rd"|"am" = "gr") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  async function loadData(u: User, r: string) {
    setLoading(true)
    try {
      if (r === "carrier") {
        const [a, req, hist, rev] = await Promise.all([
          supabase.from("loads").select("*").eq("posted_by", u.id).eq("status", "open").order("created_at", { ascending: false }),
          supabase.from("load_matches").select("*, loads(*), profiles!load_matches_escort_id_fkey(full_name, tier)").eq("carrier_id", u.id).eq("status", "pending"),
          supabase.from("loads").select("*").eq("posted_by", u.id).in("status", ["filled","expired"]).order("created_at", { ascending: false }).limit(20),
          supabase.from("reviews").select("*, profiles(full_name)").eq("reviewee_id", u.id).order("created_at", { ascending: false }).limit(10),
        ])
        setActiveLoads(a.data || [])
        setMatchRequests(req.data || [])
        setHistoryLoads(hist.data || [])
        setReviews(rev.data || [])
        setStats({ open: (a.data||[]).length, pending: (req.data||[]).length, filled: (hist.data||[]).filter((l:any)=>l.status==="filled").length })
      } else if (r === "escort") {
        const [req, rev] = await Promise.all([
          supabase.from("load_matches").select("*, loads(*), profiles!load_matches_carrier_id_fkey(full_name)").eq("escort_id", u.id).order("created_at", { ascending: false }),
          supabase.from("reviews").select("*, profiles(full_name)").eq("reviewee_id", u.id).order("created_at", { ascending: false }).limit(10),
        ])
        setMatchRequests(req.data || [])
        setReviews(rev.data || [])
      }
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleRepost(loadId: string) {
    const load = historyLoads.find(l => l.id === loadId)
    if (!load || !user) return
    const { id: _id, created_at: _c, status: _s, matched_escort_id: _m, match_requested_at: _mr, ...rest } = load
    const { error } = await supabase.from("loads").insert({ ...rest, status: "open", posted_by: user.id })
    if (error) { showToast("Failed to repost load", "rd"); return }
    showToast("Load reposted!", "gr")
    loadData(user, role)
  }

  if (loading) return (
    <div style={S.page}>
      <Header />
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#9ca3af" }}>Loading...</div>
      <Footer />
    </div>
  )

  if (!user) return (
    <div style={S.page}>
      <Header />
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ color: "#9ca3af", marginBottom: 16 }}>Please sign in to view your dashboard.</p>
        <Link href="/signin"><button style={S.btnPrime}>Sign In</button></Link>
      </div>
      <Footer />
    </div>
  )


  const manageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'No active subscription found.')
    } catch (e) {
      alert('Error opening subscription portal.')
    } finally {
      setPortalLoading(false)
    }
  }

    return (
    <div style={S.page}>
      <Header />
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999, background: toast.type === "gr" ? "#16a34a" : toast.type === "rd" ? "#dc2626" : "#d97706", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
          {toast.msg}
        </div>
      )}

      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.h1}>{isEscort ? "Escort" : "Carrier"} Dashboard</h1>
          <p style={S.sub}>Welcome back, {profile?.full_name ?? user?.email}. Manage your {isEscort ? "match requests and profile" : "loads and escorts"}.</p>
        </div>
      </div>

      {isCarrier && (
        <div style={S.section}>
          {/* Stats row */}
          <div style={S.grid3}>
            <div style={S.statCard}><div style={S.statNum}>{stats.open}</div><div style={S.statLabel}>Active Loads</div></div>
            <div style={S.statCard}><div style={{ ...S.statNum, color: "#f59e0b" }}>{stats.pending}</div><div style={S.statLabel}>Pending Matches</div></div>
            <div style={S.statCard}><div style={{ ...S.statNum, color: "#22c55e" }}>{stats.filled}</div><div style={S.statLabel}>Loads Filled</div></div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0 }}>
            {(["active","requests","history"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ ...S.btnGhost, borderRadius: "8px 8px 0 0", borderBottom: "none", marginBottom: -1, color: tab === t ? "var(--or,#f60)" : "#9ca3af", borderColor: tab === t ? "rgba(255,255,255,0.12)" : "transparent", background: tab === t ? "rgba(255,102,0,0.08)" : "transparent" }}>
                {t === "active" ? "My Active Loads" : t === "requests" ? "Match Requests" : "Load History"}
              </button>
            ))}
          </div>

          {tab === "active" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={S.sectionTitle}>Active Loads</h2>
                <Link href="/post-load"><button style={S.btnPrime}>+ Post New Load</button></Link>
              </div>
              {activeLoads.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", color: "#9ca3af", padding: 40 }}>
                  <p>No active loads yet.</p>
                  <p style={{ fontSize: 13, marginTop: 8, marginBottom: 16 }}>Post your first load to find escorts.</p>
                  <Link href="/post-load"><button style={S.btnPrime}>Post a Load</button></Link>
                </div>
              ) : (
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Route</th><th style={S.th}>Date</th><th style={S.th}>Type</th><th style={S.th}>Rate</th><th style={S.th}>Status</th><th style={S.th}>Actions</th></tr></thead>
                  <tbody>
                    {activeLoads.map(l => (
                      <tr key={l.id}>
                        <td style={S.td}>{l.pickup_city} → {l.destination_city}</td>
                        <td style={S.td}>{new Date(l.move_date).toLocaleDateString()}</td>
                        <td style={S.td}>{l.load_type}</td>
                        <td style={S.td}>${l.day_rate}/day</td>
                        <td style={S.td}><span style={S.badge("#22c55e")}>Open</span></td>
                        <td style={S.td}><button style={{ ...S.btnGhost, fontSize: 11, padding: "4px 10px" }} onClick={() => showToast("Edit coming soon", "am")}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "requests" && (
            <div>
              <h2 style={S.sectionTitle}>Match Requests</h2>
              {matchRequests.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", color: "#9ca3af", padding: 40 }}>No pending match requests.</div>
              ) : (
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Escort</th><th style={S.th}>Load</th><th style={S.th}>Tier</th><th style={S.th}>Requested</th><th style={S.th}>Actions</th></tr></thead>
                  <tbody>
                    {matchRequests.map(r => (
                      <tr key={r.id}>
                        <td style={S.td}>{(r as any).profiles?.full_name ?? "Unknown"}</td>
                        <td style={S.td}>{(r as any).loads?.pickup_city} → {(r as any).loads?.destination_city}</td>
                        <td style={S.td}>{(r as any).profiles?.tier ?? "—"}</td>
                        <td style={S.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td style={S.td}>
                          <button style={{ ...S.btnPrime, fontSize: 11, padding: "4px 12px", marginRight: 6 }} onClick={() => showToast("Acceptance coming soon", "am")}>Accept</button>
                          <button style={{ ...S.btnGhost, fontSize: 11, padding: "4px 10px" }} onClick={() => showToast("Decline coming soon", "am")}>Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "history" && (
            <div>
              <h2 style={S.sectionTitle}>Load History</h2>
              {historyLoads.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", color: "#9ca3af", padding: 40 }}>No completed loads yet.</div>
              ) : (
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Route</th><th style={S.th}>Date</th><th style={S.th}>Status</th><th style={S.th}>Rate</th><th style={S.th}>Actions</th></tr></thead>
                  <tbody>
                    {historyLoads.map(l => (
                      <tr key={l.id}>
                        <td style={S.td}>{l.pickup_city} → {l.destination_city}</td>
                        <td style={S.td}>{new Date(l.move_date).toLocaleDateString()}</td>
                        <td style={S.td}><span style={S.badge(l.status === "filled" ? "#22c55e" : "#6b7280")}>{l.status}</span></td>
                        <td style={S.td}>${l.day_rate}/day</td>
                        <td style={S.td}><button style={{ ...S.btnPrime, fontSize: 11, padding: "4px 12px" }} onClick={() => handleRepost(l.id)}>Repost</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* FREE CARRIER PERKS */}
          <div style={{ marginTop: 40 }}>
            <h2 style={S.sectionTitle}>Free Member Perks</h2>
            <div style={S.grid2}>
              {/* Quick Post via SMS */}
              <div style={S.perkCard}>
                <div style={S.perkTitle}>Quick Post via SMS <span style={S.comingSoon}>COMING SOON</span></div>
                <div style={S.perkBody}>Text your load and it auto-posts to the board. Format:<br /><code style={{ color: "#f60", fontSize: 12 }}>OEH [TYPE] pickup [CITY] destination [CITY] [DATE] [RATE]</code></div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Full setup instructions will appear when SMS is live.</div>
              </div>
              {/* Permit Hub */}
              <div style={S.perkCard}>
                <div style={S.perkTitle}>Permit Reminders</div>
                <div style={S.perkBody}>Need permits for your oversize route? Access permit tools and route planning resources.</div>
                <Link href="/tools/permits"><button style={{ ...S.btnGhost, fontSize: 12, padding: "6px 14px" }}>Visit Permit Hub →</button></Link>
              </div>
              {/* Saved Escorts */}
              <div style={S.perkCard}>
                <div style={S.perkTitle}>Saved Escorts</div>
                <div style={S.perkBody}>Save escorts you have worked with for quick rebooking. Your saved list will appear here.</div>
                <Link href="/?board=openboard"><button style={{ ...S.btnGhost, fontSize: 12, padding: "6px 14px" }}>Browse Escorts →</button></Link>
              </div>
              {/* Load Analytics */}
              <div style={S.perkCard}>
                <div style={S.perkTitle}>Load Analytics</div>
                <div style={S.perkBody}>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{stats.open + stats.filled}</span> total loads posted &nbsp;·&nbsp;
                  <span style={{ color: "#22c55e", fontWeight: 600 }}>{stats.filled}</span> filled &nbsp;·&nbsp;
                  <span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.pending}</span> pending
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Avg fill time and cert analytics coming soon.</div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 24 }}>
            <h2 style={S.sectionTitle}>Recent Reviews</h2>
            {reviews.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No reviews yet.</div>
            ) : (
              reviews.map(r => (
                <div key={r.id} style={{ ...S.card, marginBottom: 10 }}>
                  <div style={{ color: "#f59e0b", marginBottom: 4 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <div style={{ fontSize: 13, color: "#e0e0e0", marginBottom: 4 }}>{r.body ?? "(no comment)"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.profiles?.full_name ?? "Anonymous"} · {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
        {profile && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            {profile.stripe_customer_id ? (
              <button
                onClick={manageSubscription}
                disabled={portalLoading}
                style={{ background: "#f60", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
              >
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </button>
            ) : (
              <span style={{ color: "#9ca3af", fontSize: 13 }}>No active subscription</span>
            )}
          </div>
        )}
      )}

      {isEscort && (
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Your Match Requests</h2>
          {matchRequests.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", color: "#9ca3af", padding: 40 }}>No match requests yet. Browse open loads to get started.</div>
          ) : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Load</th><th style={S.th}>Carrier</th><th style={S.th}>Date</th><th style={S.th}>Status</th></tr></thead>
              <tbody>
                {matchRequests.map(r => (
                  <tr key={r.id}>
                    <td style={S.td}>{(r as any).loads?.pickup_city} → {(r as any).loads?.destination_city}</td>
                    <td style={S.td}>{(r as any).profiles?.full_name ?? "Unknown"}</td>
                    <td style={S.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={S.td}><span style={S.badge(r.status === "accepted" ? "#22c55e" : r.status === "rejected" ? "#ef4444" : "#f59e0b")}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 32 }}>
            <h2 style={S.sectionTitle}>Recent Reviews</h2>
            {reviews.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No reviews yet.</div>
            ) : (
              reviews.map(r => (
                <div key={r.id} style={{ ...S.card, marginBottom: 10 }}>
                  <div style={{ color: "#f59e0b", marginBottom: 4 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <div style={{ fontSize: 13, color: "#e0e0e0", marginBottom: 4 }}>{r.body ?? "(no comment)"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.profiles?.full_name ?? "Anonymous"} · {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isCarrier && !isEscort && (
        <div style={S.section}>
          <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
            <p style={{ color: "#9ca3af", marginBottom: 16 }}>Your account role has not been set yet.</p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Please contact support or update your profile.</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
