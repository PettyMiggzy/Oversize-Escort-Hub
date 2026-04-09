"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const createClientComponentClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import Header from "@/components/SiteHeader";
import Footer from "@/components/SiteFooter";
import Link from "next/link";

const S: any = {
  page: { minHeight: "100vh", background: "#060608", color: "#f0f0f0", fontFamily: "'Inter', sans-serif" },
  hero: { background: "linear-gradient(135deg,#0a0a0f 0%,#0e1a2e 100%)", padding: "48px 24px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  heroInner: { maxWidth: 1100, margin: "0 auto" },
  h1: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 },
  sub: { fontSize: 14, color: "#9ca3af" },
  section: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 40 },
  statCard: { background: "#0e1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" },
  statNum: { fontSize: 32, fontWeight: 700, color: "#00a8e8" },
  statLabel: { fontSize: 12, color: "#9ca3af", marginTop: 4, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "10px 14px", color: "#9ca3af", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  td: { padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e0e0e0", verticalAlign: "middle" as const },
  badge: (color: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + "22", color }),
  btnPrime: { background: "#00a8e8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, minHeight: 36 },
  btnGhost: { background: "transparent", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, minHeight: 36 },
  btnDanger: { background: "transparent", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, minHeight: 36 },
  matchCard: { background: "#0e1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 12 },
  matchTitle: { fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 6 },
  matchSub: { fontSize: 13, color: "#9ca3af" },
  profileCard: { background: "#0e1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 12 },
};

const STATUS_COLOR: Record<string, string> = {
  open: "#22c55e",
  pending_match: "#f59e0b",
  filled: "#00a8e8",
  expired: "#9ca3af",
};

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loads, setLoads] = useState<any[]>([]);
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoad, setMatchingLoad] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/signin"; return; }
      setUser(session.user);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(p);

      // My loads (as carrier)
      const { data: l } = await supabase
        .from("loads")
        .select("*")
        .eq("carrier_id", session.user.id)
        .order("created_at", { ascending: false });
      setLoads(l ?? []);

      // Pending match loads — fetch escort profiles
      const pending = (l ?? []).filter((x: any) => x.status === "pending_match" && x.matched_escort_id);
      if (pending.length) {
        const escortIds = pending.map((x: any) => x.matched_escort_id);
        const { data: escorts } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email, avg_rating, review_count, tier, bgc_verified")
          .in("id", escortIds);
        const escortMap = Object.fromEntries((escorts ?? []).map((e: any) => [e.id, e]));
        setPendingMatches(pending.map((l: any) => ({ ...l, escort: escortMap[l.matched_escort_id] })));
      }

      // My reviews
      const { data: rev } = await supabase
        .from("reviews")
        .select("id, rating, body, created_at, reviewer_id, profiles!reviewer_id(full_name)")
        .eq("reviewee_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setReviews(rev ?? []);

      setLoading(false);
    })();
  }, []);

  const handleMatch = async (loadId: string, action: "accept" | "decline") => {
    setMatchingLoad(loadId);
    const res = await fetch("/api/loads/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ load_id: loadId, action, carrier_id: user?.id }),
    });
    const data = await res.json();
    if (data.ok) {
      if (action === "accept" && data.escort_contact) {
        alert(`Matched! Escort contact:\n${data.escort_contact.full_name}\nPhone: ${data.escort_contact.phone ?? "—"}\nEmail: ${data.escort_contact.email ?? "—"}`);
      }
      // Refresh
      window.location.reload();
    } else {
      alert("Error: " + (data.error ?? "Unknown"));
    }
    setMatchingLoad(null);
  };

  const stats = {
    open: loads.filter(l => l.status === "open").length,
    pending: loads.filter(l => l.status === "pending_match").length,
    filled: loads.filter(l => l.status === "filled").length,
  };

  if (loading) return (
    <div style={S.page}><Header />
      <div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>Loading dashboard…</div>
    <Footer /></div>
  );

  return (
    <div style={S.page}>
      <Header />
      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.h1}>Carrier Dashboard</h1>
          <p style={S.sub}>Welcome back, {profile?.full_name ?? user?.email}. Manage your loads and matches.</p>
        </div>
      </div>

      <div style={S.section}>
        {/* Stats row */}
        <div style={{ ...S.grid3, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
          <div style={S.statCard}><div style={S.statNum}>{stats.open}</div><div style={S.statLabel}>Open Loads</div></div>
          <div style={S.statCard}><div style={{ ...S.statNum, color: "#f59e0b" }}>{stats.pending}</div><div style={S.statLabel}>Pending Match</div></div>
          <div style={S.statCard}><div style={{ ...S.statNum, color: "#22c55e" }}>{stats.filled}</div><div style={S.statLabel}>Filled</div></div>
        </div>

        {/* Match Notifications */}
        {pendingMatches.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={S.sectionTitle}>⚡ Match Requests ({pendingMatches.length})</h2>
            {pendingMatches.map(load => (
              <div key={load.id} style={{ ...S.matchCard, border: "1px solid #f59e0b40" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={S.matchTitle}>{load.pickup_city} → {load.destination_city}</div>
                    <div style={S.matchSub}>{load.load_type} · {new Date(load.match_requested_at).toLocaleString()}</div>
                    {load.escort && (
                      <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", marginBottom: 4 }}>
                          {load.escort.full_name}
                          {load.escort.bgc_verified && <span style={{ marginLeft: 8, fontSize: 11, color: "#22c55e" }}>✓ BGC Verified</span>}
                          {load.escort.tier === "pro" && <span style={{ marginLeft: 8, fontSize: 11, color: "#f59e0b" }}>PRO</span>}
                        </div>
                        {load.escort.avg_rating && (
                          <div style={{ fontSize: 13, color: "#f59e0b" }}>
                            {"★".repeat(Math.round(load.escort.avg_rating))} {load.escort.avg_rating.toFixed(1)} ({load.escort.review_count} reviews)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      style={S.btnPrime}
                      disabled={matchingLoad === load.id}
                      onClick={() => handleMatch(load.id, "accept")}
                    >
                      {matchingLoad === load.id ? "…" : "Accept"}
                    </button>
                    <button
                      style={S.btnDanger}
                      disabled={matchingLoad === load.id}
                      onClick={() => handleMatch(load.id, "decline")}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Loads */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ ...S.sectionTitle, marginBottom: 0, borderBottom: "none" }}>My Loads</h2>
            <Link href="/post-load" style={{ ...S.btnPrime, textDecoration: "none", display: "inline-block" }}>+ Post a Load</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Route","Type","Rate","Board","Status","Posted"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loads.length === 0 && (
                  <tr><td colSpan={6} style={{ ...S.td, color: "#9ca3af", textAlign: "center", padding: 40 }}>No loads posted yet. <Link href="/post-load" style={{ color: "#00a8e8" }}>Post one →</Link></td></tr>
                )}
                {loads.map(load => (
                  <tr key={load.id}>
                    <td style={S.td}>{load.pickup_city ?? "—"} → {load.destination_city ?? "—"}</td>
                    <td style={S.td}>{load.load_type ?? load.type ?? "—"}</td>
                    <td style={S.td}>{load.rate ? `$${Number(load.rate).toLocaleString()}` : "—"}</td>
                    <td style={S.td}>{load.board ?? load.board_type ?? "—"}</td>
                    <td style={S.td}>
                      <span style={S.badge(STATUS_COLOR[load.status] ?? "#9ca3af")}>
                        {load.status?.replace("_", " ") ?? "open"}
                      </span>
                    </td>
                    <td style={S.td}>{load.created_at ? new Date(load.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profile & Reviews */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
          <div>
            <h2 style={S.sectionTitle}>My Profile</h2>
            <div style={S.profileCard}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{profile?.full_name ?? "—"}</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>{user?.email}</div>
              {profile?.avg_rating && (
                <div style={{ fontSize: 13, color: "#f59e0b", marginBottom: 12 }}>
                  {"★".repeat(Math.round(profile.avg_rating))} {Number(profile.avg_rating).toFixed(1)} ({profile.review_count} reviews)
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/verify" style={{ ...S.btnGhost, textDecoration: "none", display: "inline-block" }}>Verification</Link>
                <Link href="/referral" style={{ ...S.btnGhost, textDecoration: "none", display: "inline-block" }}>Referrals</Link>
              </div>
            </div>
          </div>
          <div>
            <h2 style={S.sectionTitle}>Recent Reviews</h2>
            {reviews.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No reviews yet.</div>
            ) : (
              reviews.map(r => (
                <div key={r.id} style={{ ...S.matchCard, marginBottom: 10 }}>
                  <div style={{ color: "#f59e0b", marginBottom: 4 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <div style={{ fontSize: 13, color: "#e0e0e0", marginBottom: 4 }}>{r.body ?? "(no comment)"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.profiles?.full_name ?? "Anonymous"} · {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
