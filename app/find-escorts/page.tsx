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
  heroInner: { maxWidth: 1100, margin: "0 auto" },
  h1: { fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 },
  sub: { fontSize: 14, color: "#9ca3af" },
  section: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 },
  card: { background: "#0e1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 },
  name: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 },
  badge: (c: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: c + "22", color: c, marginRight: 6 }),
  stars: { color: "#f59e0b", fontSize: 13, marginTop: 6 },
  reviewCount: { color: "#9ca3af", fontSize: 12, marginLeft: 4 },
  btn: { marginTop: 16, width: "100%", background: "#00a8e8", color: "#fff", border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 600, minHeight: 44 },
  filter: { display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 28 },
  filterBtn: (active: boolean) => ({
    background: active ? "#00a8e8" : "rgba(255,255,255,0.05)",
    color: active ? "#fff" : "#9ca3af",
    border: "1px solid " + (active ? "#00a8e8" : "rgba(255,255,255,0.08)"),
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
    minHeight: 40,
    fontWeight: active ? 600 : 400,
  }),
};

export default function FindEscortsPage() {
  const supabase = createClientComponentClient();
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all")
  const [certFilter, setCertFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, tier, bgc_verified, avg_rating, review_count, state, cert_types, avatar_url")
        .eq("role", "escort")
        .order("avg_rating", { ascending: false });
      setEscorts(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = escorts.filter(e => {
    if (filter === "pro") return e.tier === "pro";
    if (filter === "bgc") return e.bgc_verified;
    return true;
  });

  return (
    <div style={S.page}>
      <Header />
      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.h1}>Find Escorts</h1>
          <p style={S.sub}>Browse verified oversize escort pilots available in your area.</p>
        </div>
      </div>
      <div style={S.section}>
        <div style={S.filter}>
          {[["all","All Escorts"],["pro","Pro Only"],["bgc","BGC Verified"]].map(([key,label]) => (
            <button key={key} style={S.filterBtn(filter === key)} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
          <div style={{marginTop:12}}>
            <select
              value={certFilter}
              onChange={e => setCertFilter(e.target.value)}
              style={{background:"#1a1a1a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"6px 12px",fontSize:14,cursor:"pointer"}}
            >
              <option value="">All Certifications</option>
              <option value="Lead">Lead</option>
              <option value="Chase">Chase</option>
              <option value="High Pole">High Pole</option>
              <option value="Lineman">Lineman</option>
              <option value="Rear Steer">Rear Steer</option>
              <option value="Survey">Survey</option>
              <option value="Flagger">Flagger</option>
              <option value="NY Cert">NY Cert</option>
              <option value="CSE (Ontario MTO)">CSE (Ontario MTO)</option>
              <option value="BC Pilot Car">BC Pilot Car</option>
              <option value="WITPAC">WITPAC</option>
              <option value="TWIC">TWIC</option>
              <option value="AZ Cert">AZ Cert</option>
              <option value="CTTS BC/AB">CTTS BC/AB</option>
              <option value="OAPC Ontario">OAPC Ontario</option>
              <option value="Saskatchewan">Saskatchewan</option>
            </select>
          </div>
        {loading ? (
          <div style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>Loading escorts…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>No escorts found.</div>
        ) : (
          <div style={S.grid}>
            {filtered.map(e => (
              <div key={e.id} style={S.card}>
                <div style={S.name}>{e.full_name ?? "Escort"}</div>
                <div style={{ marginTop: 8 }}>
                  {e.tier === "pro" && <span style={S.badge("#f59e0b")}>PRO</span>}
                  {e.bgc_verified && <span style={S.badge("#22c55e")}>BGC ✓</span>}
                  {e.state && <span style={S.badge("#9ca3af")}>{e.state}</span>}
                </div>
                {e.avg_rating ? (
                  <div style={S.stars}>
                    {"★".repeat(Math.round(e.avg_rating))}{"☆".repeat(5 - Math.round(e.avg_rating))}
                    <span style={S.reviewCount}>{Number(e.avg_rating).toFixed(1)} ({e.review_count} reviews)</span>
                  </div>
                ) : (
                  <div style={{ ...S.stars, color: "#9ca3af" }}>No reviews yet</div>
                )}
                {e.cert_types?.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
                    Certs: {e.cert_types.join(", ")}
                  </div>
                )}
                <button style={S.btn}>View Profile</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
