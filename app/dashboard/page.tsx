"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Load, Profile } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/signin");
        return;
      }
      setUser(session.user);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const typedProfile = profileData as Profile | null;

      if (typedProfile) {
        setProfile(typedProfile);

        // If carrier, load their posted loads
        if (typedProfile.role === "carrier") {
          const { data: loadsData } = await supabase
            .from("loads")
            .select("*")
            .eq("carrier_id", session.user.id)
            .order("created_at", { ascending: false });
          if (loadsData) setLoads(loadsData as Load[]);
        }
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <main style={S.main}>
        <div style={S.loadingWrap}>
          <div style={S.loadingText}>LOADING DASHBOARD...</div>
        </div>
      </main>
    );
  }

  const role = profile?.role ?? (user?.user_metadata?.role as string | undefined);
  const email = user?.email ?? "";
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? email.split("@")[0];
  const company = profile?.company_name ?? user?.user_metadata?.company_name ?? null;

  return (
    <main style={S.main}>
      {/* Top nav */}
      <header style={S.header}>
        <Link href="/" style={S.brand}>OVERSIZE ESCORT HUB</Link>
        <nav style={S.nav}>
          <Link href="/loads" style={S.navLink}>Load Board</Link>
          <Link href="/bid-board" style={S.navLink}>Bid Board</Link>
          <Link href="/post-load" style={S.navLink}>Post Load</Link>
          <button style={S.signOutBtn} onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}>
            Sign Out
          </button>
        </nav>
      </header>

      <div style={S.wrap}>
        {/* Welcome banner */}
        <div style={S.welcomeBanner}>
          <div style={S.welcomeLeft}>
            <div style={S.welcomeTag}>
              {role === "carrier" ? "🚛 CARRIER DASHBOARD" : "🚗 ESCORT DASHBOARD"}
            </div>
            <h1 style={S.h1}>Welcome back, {displayName}</h1>
            {company && <div style={S.companyTag}>{company}</div>}
            <div style={S.emailTag}>{email}</div>
          </div>
          <div style={S.roleBadge} data-role={role}>
            {role === "carrier" ? "CARRIER" : "ESCORT / P/EVO"}
          </div>
        </div>

        {/* Metrics row */}
        <div style={S.metricsGrid}>
          {role === "carrier" ? (
            <>
              <MetricCard value={loads.length.toString()} label="Loads Posted" color="#ff6200" />
              <MetricCard
                value={loads.filter((l) => l.status === "open").length.toString()}
                label="Active Loads"
                color="#00cc7a"
              />
              <MetricCard
                value={loads.filter((l) => l.status === "filled").length.toString()}
                label="Filled Loads"
                color="#3d8ef8"
              />
              <MetricCard value={profile?.rating ? profile.rating.toFixed(1) : "New"} label="Pay Score" color="#f5a200" />
            </>
          ) : (
            <>
              <MetricCard value={profile?.total_jobs?.toString() ?? "0"} label="Jobs Completed" color="#f5a200" />
              <MetricCard value={profile?.rating ? profile.rating.toFixed(1) : "New"} label="Platform Rating" color="#00cc7a" />
              <MetricCard value={profile?.reliability_score ? `${profile.reliability_score}%` : "—"} label="Reliability" color="#3d8ef8" />
              <MetricCard value={profile?.tier?.toUpperCase() ?? "FREE"} label="Membership Tier" color="#ff6200" />
            </>
          )}
        </div>

        {/* Role-specific content */}
        {role === "carrier" ? (
          <CarrierSection loads={loads} />
        ) : (
          <EscortSection />
        )}
      </div>
    </main>
  );
}

/* ── Carrier section ── */
function CarrierSection({ loads }: { loads: Load[] }) {
  return (
    <div style={S.section}>
      <div style={S.sectionHeader}>
        <div>
          <div style={S.eyebrow}>Your Loads</div>
          <h2 style={S.h2}>POSTED LOADS</h2>
        </div>
        <Link href="/post-load" style={S.ctaBtn}>+ Post New Load</Link>
      </div>

      {loads.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🚛</div>
          <div style={S.emptyTitle}>No loads posted yet</div>
          <div style={S.emptyDesc}>Be the first carrier in your region. Verified escorts are waiting.</div>
          <Link href="/post-load" style={S.ctaBtn}>Post Your First Load →</Link>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Load ID", "Route", "Miles", "Rate", "Position", "Board", "Status", "Date"].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loads.map((l) => (
                <tr key={l.id} style={S.tr}>
                  <td style={S.tdMono}>{l.id.slice(0, 8).toUpperCase()}</td>
                  <td style={S.tdStrong}>
                    {l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}
                  </td>
                  <td style={S.tdMono}>{l.miles ?? "—"}</td>
                  <td style={{ ...S.tdMono, color: "#00cc7a" }}>${l.per_mile_rate.toFixed(2)}/mi</td>
                  <td style={S.td}>{l.position}</td>
                  <td style={S.td}>
                    <span style={{
                      ...S.badge,
                      background: l.board_type === "flat" ? "rgba(0,204,122,.12)" : l.board_type === "bid" ? "rgba(245,162,0,.12)" : "rgba(61,142,248,.12)",
                      color: l.board_type === "flat" ? "#00cc7a" : l.board_type === "bid" ? "#f5a200" : "#3d8ef8",
                      border: `1px solid ${l.board_type === "flat" ? "rgba(0,204,122,.25)" : l.board_type === "bid" ? "rgba(245,162,0,.25)" : "rgba(61,142,248,.25)"}`,
                    }}>
                      {l.board_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      ...S.badge,
                      background: l.status === "open" ? "rgba(0,204,122,.12)" : "rgba(110,122,136,.12)",
                      color: l.status === "open" ? "#00cc7a" : "#6e7a88",
                      border: `1px solid ${l.status === "open" ? "rgba(0,204,122,.25)" : "rgba(110,122,136,.25)"}`,
                    }}>
                      {l.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={S.tdMono}>{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Escort section ── */
function EscortSection() {
  return (
    <div style={S.section}>
      <div style={S.sectionHeader}>
        <div>
          <div style={S.eyebrow}>Quick Links</div>
          <h2 style={S.h2}>FIND YOUR NEXT RUN</h2>
        </div>
      </div>
      <div style={S.escortGrid}>
        <QuickLinkCard
          href="/loads"
          color="#00cc7a"
          icon="📋"
          title="Find Loads"
          desc="Browse the flat rate load board. First-come, first-served. Contact info unlocked with membership."
        />
        <QuickLinkCard
          href="/bid-board"
          color="#f5a200"
          icon="⚡"
          title="Bid Board"
          desc="Live 5-minute auction board. Pro members get SMS alerts and a 60-second head start."
        />
        <QuickLinkCard
          href="/verify"
          color="#3d8ef8"
          icon="✅"
          title="Get Verified"
          desc="Build your trust score. P/EVO cert, vehicle verification, background check, and admin approval."
        />
        <QuickLinkCard
          href="/pricing"
          color="#ff6200"
          icon="🚀"
          title="Upgrade Tier"
          desc="Unlock contact info, bid on loads, and get SMS alerts before anyone else."
        />
      </div>
    </div>
  );
}

/* ── Helper components ── */
function MetricCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={S.metric}>
      <div style={{ ...S.metricValue, color }}>{value}</div>
      <div style={S.metricLabel}>{label}</div>
    </div>
  );
}

function QuickLinkCard({ href, color, icon, title, desc }: {
  href: string;
  color: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} style={{ ...S.quickCard, borderTopColor: color, textDecoration: "none" }}>
      <div style={S.quickIcon}>{icon}</div>
      <div style={{ ...S.quickTitle, color }}>{title}</div>
      <p style={S.quickDesc}>{desc}</p>
      <div style={{ ...S.quickArrow, color }}>View →</div>
    </Link>
  );
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#06080a",
    color: "#dce0e6",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13,
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  loadingText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "#6e7a88",
    letterSpacing: "0.2em",
  },

  header: {
    padding: "16px clamp(16px, 4vw, 48px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(6,8,10,0.98)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontSize: "clamp(14px, 3vw, 18px)",
    letterSpacing: "0.06em",
    color: "#dce0e6",
    textDecoration: "none",
  },
  nav: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  navLink: {
    color: "rgba(220,224,230,0.7)",
    textDecoration: "none",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.1em",
  },
  signOutBtn: {
    background: "none",
    border: "1px solid rgba(255,53,53,0.3)",
    color: "#ff3535",
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    padding: "6px 12px",
    borderRadius: 2,
    cursor: "pointer",
    textTransform: "uppercase",
  },

  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "clamp(16px, 4vw, 40px) clamp(16px, 4vw, 40px)",
  },

  welcomeBanner: {
    background: "linear-gradient(135deg, rgba(15,19,24,0.9), rgba(20,26,31,0.9))",
    border: "1px solid rgba(28,34,41,0.8)",
    borderRadius: 4,
    padding: "24px 28px",
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  welcomeLeft: {},
  welcomeTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#ff6200",
    marginBottom: 8,
  },
  h1: {
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontSize: "clamp(24px, 5vw, 38px)",
    lineHeight: 1,
    color: "#dce0e6",
    margin: "0 0 8px 0",
  },
  companyTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "#6e7a88",
    marginBottom: 4,
  },
  emailTag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "#363f4a",
  },
  roleBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "8px 14px",
    border: "1px solid rgba(255,98,0,0.3)",
    color: "#ff6200",
    borderRadius: 2,
    alignSelf: "flex-start",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginBottom: 24,
  },
  metric: {
    background: "#141a1f",
    border: "1px solid #1c2229",
    borderRadius: 3,
    padding: "14px 16px",
  },
  metricValue: {
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontSize: 28,
    lineHeight: 1,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6e7a88",
  },

  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  eyebrow: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#00cc7a",
    marginBottom: 4,
  },
  h2: {
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontSize: "clamp(20px, 4vw, 30px)",
    color: "#dce0e6",
    lineHeight: 1.05,
    margin: 0,
  },
  ctaBtn: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 700,
    padding: "10px 18px",
    background: "#ff6200",
    color: "#000",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },

  emptyState: {
    background: "rgba(255,98,0,0.04)",
    border: "1px solid rgba(255,98,0,0.12)",
    borderRadius: 4,
    padding: "36px 24px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: {
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontSize: 24,
    color: "#ff6200",
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "#6e7a88",
    marginBottom: 20,
    lineHeight: 1.6,
  },

  tableWrap: {
    border: "1px solid #1c2229",
    borderRadius: 4,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    minWidth: 600,
  },
  th: {
    background: "#141a1f",
    padding: "8px 12px",
    textAlign: "left",
    fontSize: 8,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#6e7a88",
    borderBottom: "1px solid #1c2229",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(28,34,41,0.7)",
  },
  td: {
    padding: "11px 12px",
    color: "#dce0e6",
  },
  tdMono: {
    padding: "11px 12px",
    color: "#6e7a88",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  tdStrong: {
    padding: "11px 12px",
    color: "#dce0e6",
    fontWeight: 600,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "2px 8px",
    borderRadius: 2,
  },

  escortGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  quickCard: {
    background: "#0f1318",
    border: "1px solid #1c2229",
    borderTop: "2px solid #ff6200",
    borderRadius: 4,
    padding: "18px 20px",
    display: "block",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  quickIcon: { fontSize: 24, marginBottom: 10 },
  quickTitle: {
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    fontSize: 18,
    lineHeight: 1,
    marginBottom: 8,
  },
  quickDesc: {
    fontSize: 12,
    color: "#6e7a88",
    lineHeight: 1.75,
    marginBottom: 12,
    margin: "0 0 12px 0",
  },
  quickArrow: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    fontWeight: 700,
  },
};
