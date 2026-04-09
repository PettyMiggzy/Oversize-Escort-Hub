"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const createClientComponentClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import Header from "@/components/SiteHeader";
import Footer from "@/components/SiteFooter";

const S: any = {
  page: { minHeight: "100vh", background: "#060608", color: "#f0f0f0", fontFamily: "'Inter', sans-serif" },
  hero: { background: "linear-gradient(135deg,#0a0a0f 0%,#0e1a2e 100%)", padding: "56px 24px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  heroInner: { maxWidth: 860, margin: "0 auto", textAlign: "center" as const },
  h1: { fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 10 },
  sub: { fontSize: 15, color: "#9ca3af", maxWidth: 560, margin: "0 auto" },
  section: { maxWidth: 860, margin: "0 auto", padding: "48px 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 40 },
  card: { background: "#0e1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 },
  cardSub: { fontSize: 13, color: "#9ca3af", lineHeight: 1.6, marginBottom: 20 },
  btn: { width: "100%", padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, border: "none", minHeight: 48, transition: "opacity 0.2s" },
  btnPrime: { background: "#00a8e8", color: "#fff" },
  btnGold: { background: "#f59e0b", color: "#000" },
  btnGhost: { background: "rgba(255,255,255,0.06)", color: "#e0e0e0", border: "1px solid rgba(255,255,255,0.12)" },
  btnSuccess: { background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e40", cursor: "default" },
  statusBadge: (ok: boolean) => ({
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
    borderRadius: 99, fontSize: 12, fontWeight: 600,
    background: ok ? "#22c55e22" : "rgba(255,255,255,0.05)",
    color: ok ? "#22c55e" : "#9ca3af",
  }),
  fileInput: { display: "none" },
  uploadArea: { border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "24px 16px", textAlign: "center" as const, cursor: "pointer", marginBottom: 12, fontSize: 13, color: "#9ca3af" },
  toast: { position: "fixed" as const, bottom: 24, right: 24, background: "#0e1018", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 20px", fontSize: 13, color: "#e0e0e0", zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" },
};

export default function VerifyPage() {
  const supabase = createClientComponentClient();
  const dd214Ref = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bgcLoading, setBgcLoading] = useState(false);
  const [dd214Loading, setDd214Loading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/signin"; return; }
      setSession(session);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(p);
      setLoading(false);

      // Check for BGC return
      const params = new URLSearchParams(window.location.search);
      if (params.get("bgc") === "success") showToast("✓ Background check payment received. Processing…");
      if (params.get("bgc") === "cancel") showToast("Background check payment cancelled.");
    })();
  }, []);

  const handleBGC = async () => {
    if (!session) return;
    setBgcLoading(true);
    try {
      const res = await fetch("/api/bgc-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, email: session.user.email }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      showToast("Error starting checkout. Try again.");
    }
    setBgcLoading(false);
  };

  const handleDD214 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setDd214Loading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("user_id", session.user.id);
    fd.append("email", session.user.email ?? "");
    try {
      const res = await fetch("/api/dd214", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        showToast("✓ DD-214 submitted. We'll review and verify within 24 hours.");
        setProfile((p: any) => ({ ...p, dd214_pending: true }));
      } else {
        showToast("Upload failed: " + (data.error ?? "Unknown error"));
      }
    } catch (err) {
      showToast("Upload error. Check your connection and try again.");
    }
    setDd214Loading(false);
  };

  const handleCDL = () => showToast("CDL verification: upload a photo of your CDL to verify@oversize-escort-hub.com with subject: CDL - " + (session?.user?.id ?? ""));
  const handleInsurance = () => showToast("Insurance verification: email proof to verify@oversize-escort-hub.com with subject: Insurance - " + (session?.user?.id ?? ""));
  const handlePilotCert = () => showToast("Pilot cert: email a copy to verify@oversize-escort-hub.com with subject: PilotCert - " + (session?.user?.id ?? ""));

  if (loading) return <div style={S.page}><Header /><div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>Loading…</div><Footer /></div>;

  const isVerified = (field: string) => !!profile?.[field];

  const cards = [
    {
      title: "Background Check",
      icon: "🔒",
      desc: "Get the BGC badge displayed on your profile. One-time $9.99 fee. Processed within 2-3 business days.",
      price: "$9.99",
      action: handleBGC,
      loading: bgcLoading,
      done: isVerified("bgc_verified"),
      doneLabel: "BGC Verified ✓",
      btnLabel: bgcLoading ? "Redirecting…" : "Get Background Check",
      btnStyle: "btnGold",
    },
    {
      title: "DD-214 Veteran Verification",
      icon: "🇺🇸",
      desc: "Upload your DD-214 to receive the Veteran badge on your profile. Reviewed within 24 hours.",
      action: () => dd214Ref.current?.click(),
      loading: dd214Loading,
      done: isVerified("dd214_verified"),
      doneLabel: profile?.dd214_pending ? "DD-214 Pending Review" : "DD-214 Verified ✓",
      btnLabel: dd214Loading ? "Uploading…" : "Upload DD-214",
      btnStyle: "btnGhost",
      isUpload: true,
    },
    {
      title: "CDL Verification",
      icon: "🚗",
      desc: "Verify your Commercial Driver License to unlock CDL-required loads.",
      action: handleCDL,
      done: isVerified("cdl_verified"),
      doneLabel: "CDL Verified ✓",
      btnLabel: "Verify CDL",
      btnStyle: "btnGhost",
    },
    {
      title: "Insurance Verification",
      icon: "📋",
      desc: "Submit proof of insurance to display the Insured badge on your profile.",
      action: handleInsurance,
      done: isVerified("insurance_verified"),
      doneLabel: "Insurance Verified ✓",
      btnLabel: "Submit Insurance",
      btnStyle: "btnGhost",
    },
    {
      title: "Pilot Car Certification",
      icon: "🚩",
      desc: "Upload your pilot car operator certification to unlock certified loads.",
      action: handlePilotCert,
      done: isVerified("pilot_cert_verified"),
      doneLabel: "Cert Verified ✓",
      btnLabel: "Submit Certification",
      btnStyle: "btnGhost",
    },
    {
      title: "Pro Membership",
      icon: "⭐",
      desc: "Upgrade to Pro for exclusive early access to loads and priority matching.",
      action: () => window.location.href = "/pricing",
      done: profile?.tier === "pro",
      doneLabel: "Pro Member ✓",
      btnLabel: "Upgrade to Pro →",
      btnStyle: "btnPrime",
    },
  ];

  return (
    <div style={S.page}>
      <Header />

      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.h1}>Verification Center</h1>
          <p style={S.sub}>Build trust and unlock more loads by verifying your credentials. Each badge appears on your public profile.</p>
        </div>
      </div>

      <div style={S.section}>
        <div style={S.grid}>
          {cards.map(card => (
            <div key={card.title} style={S.card}>
              <div style={S.cardTitle}>
                <span>{card.icon}</span>
                <span>{card.title}</span>
                {card.done && <span style={S.statusBadge(true)}>✓</span>}
              </div>
              <div style={S.cardSub}>{card.desc}</div>
              {card.price && !card.done && (
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b", marginBottom: 14 }}>{card.price}</div>
              )}
              {card.done ? (
                <button style={{ ...S.btn, ...S.btnSuccess }}>{card.doneLabel}</button>
              ) : (
                <button
                  style={{ ...S.btn, ...S[card.btnStyle], opacity: card.loading ? 0.6 : 1 }}
                  onClick={card.action}
                  disabled={card.loading}
                >
                  {card.btnLabel}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Hidden DD-214 file input */}
        <input
          ref={dd214Ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={S.fileInput}
          onChange={handleDD214}
        />

        {/* Info box */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>About the OEH Trust System</div>
          <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7 }}>
            OEH uses a private trust scoring system. Each verification badge improves your match priority and visibility.
            Repeated cancellations or no-shows reduce your ranking. Verified members see better load opportunities and
            appear higher in carrier searches. All documents are reviewed by the OEH team and are never publicly shared.
          </div>
        </div>
      </div>

      <Footer />

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
