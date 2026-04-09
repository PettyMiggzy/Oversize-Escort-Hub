"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const createClientComponentClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import Header from "@/components/SiteHeader";
import Footer from "@/components/SiteFooter";

const S: any = {
  page: { minHeight: "100vh", background: "#060608", color: "#f0f0f0", fontFamily: "'Inter', sans-serif" },
  hero: { background: "linear-gradient(135deg,#0a0a0f 0%,#0e1a2e 100%)", padding: "48px 24px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  heroInner: { maxWidth: 800, margin: "0 auto" },
  h1: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 },
  sub: { fontSize: 14, color: "#9ca3af" },
  section: { maxWidth: 800, margin: "0 auto", padding: "40px 24px" },
  card: { background: "#0e1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 28, marginBottom: 24 },
  label: { fontSize: 12, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 },
  linkBox: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const },
  linkInput: { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", minWidth: 0 },
  copyBtn: { background: "#00a8e8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const, minHeight: 44 },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 16, marginTop: 20 },
  stat: { background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "16px", textAlign: "center" as const },
  statNum: { fontSize: 28, fontWeight: 700, color: "#00a8e8" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 4, textTransform: "uppercase" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13, marginTop: 16 },
  th: { textAlign: "left" as const, padding: "10px 12px", color: "#9ca3af", fontSize: 11, textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  td: { padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e0e0e0" },
  badge: (c: string) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, background: c + "22", color: c }),
};

export default function ReferralPage() {
  const supabase = createClientComponentClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/signin"; return; }
      setUserId(session.user.id);
      const res = await fetch(`/api/referral?user_id=${session.user.id}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    })();
  }, []);

  const copy = () => {
    if (!data?.link) return;
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={S.page}><Header /><div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>Loading…</div><Footer /></div>;

  return (
    <div style={S.page}>
      <Header />
      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.h1}>Referral Program</h1>
          <p style={S.sub}>Refer escorts and carriers to OEH — rewards structure coming soon.</p>
        </div>
      </div>
      <div style={S.section}>
        <div style={S.card}>
          <div style={S.label}>Your Referral Link</div>
          <div style={S.linkBox}>
            <input style={S.linkInput} readOnly value={data?.link ?? ""} onClick={e => (e.target as HTMLInputElement).select()} />
            <button style={S.copyBtn} onClick={copy}>{copied ? "Copied!" : "Copy Link"}</button>
          </div>
          <div style={S.statRow}>
            <div style={S.stat}><div style={S.statNum}>{data?.total ?? 0}</div><div style={S.statLabel}>Total Referrals</div></div>
            <div style={S.stat}><div style={S.statNum}>{data?.converted ?? 0}</div><div style={S.statLabel}>Converted</div></div>
            <div style={S.stat}><div style={{ ...S.statNum, color: "#22c55e" }}>TBD</div><div style={S.statLabel}>Rewards Earned</div></div>
          </div>
        </div>

        {data?.referrals?.length > 0 && (
          <div style={S.card}>
            <div style={S.label}>Referral History</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Converted</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((r: any) => (
                  <tr key={r.id}>
                    <td style={S.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={S.td}>
                      <span style={S.badge(r.status === "converted" ? "#22c55e" : r.status === "rewarded" ? "#00a8e8" : "#9ca3af")}>
                        {r.status}
                      </span>
                    </td>
                    <td style={S.td}>{r.converted_at ? new Date(r.converted_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ ...S.card, background: "rgba(0,168,232,0.05)", border: "1px solid rgba(0,168,232,0.2)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#00a8e8", marginBottom: 8 }}>Rewards Structure — Coming Soon</div>
          <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
            We're finalizing the reward tiers. Your referrals are already being tracked — you'll receive credit for every member who joins through your link. Check back soon for the full reward schedule.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
