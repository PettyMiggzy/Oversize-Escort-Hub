"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function PostLoadPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    puCity: "",
    puState: "",
    puZip: "",
    dlCity: "",
    dlState: "",
    dlZip: "",
    miles: "",
    loadDate: "",
    position: "Lead",
    boardType: "Regular Load Board",
    payTimeframe: "Fast Pay (within 10 business days)",
    maxRate: "2.00",
    overnightRate: "100",
    noGoFee: "300",
    reqWitpac: false,
    reqPassport: false,
    quickPay: false,
    contactName: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      router.push("/signin");
      return;
    }

    if (!form.puCity || !form.puState || !form.dlCity || !form.dlState) {
      setError("Please fill in origin and destination.");
      return;
    }

    setSaving(true);

    const boardTypeMap: Record<string, "flat" | "bid" | "open"> = {
      "Regular Load Board": "flat",
      "Bid Board (5-minute window)": "bid",
    };

    const { error: dbErr } = await supabase.from("loads").insert({
      carrier_id: user.id,
      board_type: boardTypeMap[form.boardType] ?? "flat",
      pu_city: form.puCity,
      pu_state: form.puState.toUpperCase(),
      dl_city: form.dlCity,
      dl_state: form.dlState.toUpperCase(),
      miles: parseInt(form.miles) || null,
      position: form.position,
      pay_type: form.payTimeframe,
      per_mile_rate: parseFloat(form.maxRate) || 2.0,
      day_rate: 500,
      overnight_fee: parseFloat(form.overnightRate) || 100,
      no_go_fee: parseFloat(form.noGoFee) || 300,
      requires_p_evo: true,
      requires_witpac: form.reqWitpac,
      requires_ny_cert: false,
      requires_twic: false,
      notes: form.notes || null,
      start_date: form.loadDate || null,
      status: "open",
    });

    setSaving(false);

    if (dbErr) {
      setError("Error posting load: " + dbErr.message);
    } else {
      setSuccess("Load posted successfully! Redirecting to the board...");
      setTimeout(() => router.push("/loads"), 2000);
    }
  }

  return (
    <main style={S.main}>
      <Header />

      <section style={S.wrap}>
        <h1 style={S.h1}>Post a Load (FREE)</h1>
        <p style={S.sub}>
          Brokers, carriers, and drivers can post unlimited loads at no cost.
          Escorts will only bid on complete, clear postings.
        </p>

        {/* Auth gate */}
        {!loadingAuth && !user && (
          <div style={S.authGate}>
            <div style={S.authGateTitle}>Sign in to post a load</div>
            <p style={S.authGateSub}>
              You need a free account to post loads. It only takes 30 seconds.
            </p>
            <a href="/signin" style={S.authGateBtn}>
              Create Free Account →
            </a>
          </div>
        )}

        {!loadingAuth && user && (
          <div style={S.panel}>
            {error && <div style={S.errorBox}>{error}</div>}
            {success && <div style={S.successBox}>{success}</div>}

            <form style={S.form} onSubmit={handleSubmit}>
              {/* LOAD INFO */}
              <SectionTitle title="Load Details" />
              <Grid>
                <Input label="Pickup City" required value={form.puCity} onChange={(v) => set("puCity", v)} />
                <Input label="Pickup State" required value={form.puState} onChange={(v) => set("puState", v)} />
                <Input label="Pickup ZIP" value={form.puZip} onChange={(v) => set("puZip", v)} />
                <Input label="Drop-off City" required value={form.dlCity} onChange={(v) => set("dlCity", v)} />
                <Input label="Drop-off State" required value={form.dlState} onChange={(v) => set("dlState", v)} />
                <Input label="Drop-off ZIP" value={form.dlZip} onChange={(v) => set("dlZip", v)} />
              </Grid>

              <Grid>
                <Input label="Estimated Miles" required value={form.miles} onChange={(v) => set("miles", v)} type="number" />
                <Input label="Load Date (MM/DD/YYYY)" required value={form.loadDate} onChange={(v) => set("loadDate", v)} />
                <Select
                  label="Escort Position Needed"
                  value={form.position}
                  onChange={(v) => set("position", v)}
                  options={["Lead", "Escort", "High Pole", "Route Survey", "Steer / Tiller"]}
                />
                <Select
                  label="Board Type"
                  value={form.boardType}
                  onChange={(v) => set("boardType", v)}
                  options={["Regular Load Board", "Bid Board (5-minute window)"]}
                />
              </Grid>

              {/* PAY TERMS */}
              <SectionTitle title="Pay Terms" />
              <Grid>
                <Select
                  label="Pay Timeframe"
                  value={form.payTimeframe}
                  onChange={(v) => set("payTimeframe", v)}
                  options={["Fast Pay (within 10 business days)", "7 Days", "10 Days", "Custom"]}
                />
                <Input label="Max $ / Mile (Bid Board)" value={form.maxRate} onChange={(v) => set("maxRate", v)} type="number" />
                <Input label="Overnight Rate ($100 recommended)" value={form.overnightRate} onChange={(v) => set("overnightRate", v)} type="number" />
                <Input label="No-Go Fee ($300 recommended)" value={form.noGoFee} onChange={(v) => set("noGoFee", v)} type="number" />
              </Grid>

              {/* SPECIAL REQUIREMENTS */}
              <SectionTitle title="Special Requirements (Optional)" />
              <Grid>
                <Check label="WITPAC / NY Certified" checked={form.reqWitpac} onChange={(v) => set("reqWitpac", v)} />
                <Check label="Passport Required (Canada)" checked={form.reqPassport} onChange={(v) => set("reqPassport", v)} />
                <Check label="Quick Pay Preferred" checked={form.quickPay} onChange={(v) => set("quickPay", v)} />
              </Grid>

              {/* CONTACT */}
              <SectionTitle title="Contact Method" />
              <Grid>
                <Input label="Company / Contact Name" required value={form.contactName} onChange={(v) => set("contactName", v)} />
                <Input label="Phone Number" required value={form.phone} onChange={(v) => set("phone", v)} />
                <Input label="Email Address" required value={form.email} onChange={(v) => set("email", v)} type="email" />
              </Grid>

              <div style={S.noteField}>
                <label style={S.label}>Special Instructions / Notes</label>
                <textarea
                  style={{ ...S.input, minHeight: 80, resize: "vertical" }}
                  placeholder="Route details, access notes, timing requirements..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>

              <div style={S.notice}>
                Escorts are responsible for carrying proper insurance. This platform connects parties — agreements are between escort and company.
              </div>

              <button style={S.primaryBtn} type="submit" disabled={saving}>
                {saving ? "Posting..." : "POST LOAD FREE"}
              </button>
            </form>
          </div>
        )}

        {loadingAuth && (
          <div style={{ color: "#9ca3af", marginTop: 24, fontFamily: "monospace" }}>Loading...</div>
        )}
      </section>

      <Footer />
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Header() {
  return (
    <header style={S.header}>
      <a href="/" style={S.brand}>OVERSIZE ESCORT HUB</a>
      <nav style={S.nav}>
        <a style={S.navLink} href="/loads">Load Boards</a>
        <a style={S.navLink} href="/pricing">Membership</a>
        <a style={S.navLink} href="/verify">Verification</a>
        <a style={S.navLink} href="/signin">Sign In</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer style={S.footer}>
      <div style={S.footerInner}>
        <div>
          <strong>OVERSIZE ESCORT HUB</strong>
          <div style={S.footerMuted}>support@oversize-escort-hub.com</div>
        </div>
        <div style={S.footerLinks}>
          <a style={S.footerLink} href="/terms">Terms</a>
          <a style={S.footerLink} href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div style={S.sectionTitle}>{title}</div>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={S.grid}>{children}</div>;
}

function Input({ label, required, value, onChange, type = "text" }: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={S.field}>
      <label style={S.label}>
        {label} {required && "*"}
      </label>
      <input
        style={S.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function Select({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <select style={S.input} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={S.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

/* ================= STYLES ================= */

const S: any = {
  main: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb" },
  header: {
    padding: "18px 56px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
  },
  brand: { fontWeight: 900, color: "#00a8e8", textDecoration: "none" },
  nav: { display: "flex", gap: 16 },
  navLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },

  wrap: { padding: "40px 56px" },
  h1: { fontSize: 40, fontWeight: 900 },
  sub: { marginTop: 8, color: "#9ca3af" },

  authGate: {
    marginTop: 32,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,168,232,0.3)",
    borderRadius: 20,
    padding: "36px 32px",
    maxWidth: 480,
  },
  authGateTitle: { fontWeight: 900, fontSize: 22, color: "#00a8e8", marginBottom: 10 },
  authGateSub: { color: "#9ca3af", fontSize: 14, marginBottom: 20 },
  authGateBtn: {
    display: "inline-block",
    textDecoration: "none",
    padding: "12px 22px",
    borderRadius: 12,
    background: "linear-gradient(135deg,#00a8e8,#1fb6ff)",
    color: "#001018",
    fontWeight: 900,
    fontSize: 14,
  },

  errorBox: {
    background: "rgba(255,53,53,0.1)",
    border: "1px solid rgba(255,53,53,0.3)",
    color: "#ff6b6b",
    padding: "12px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },
  successBox: {
    background: "rgba(0,230,118,0.1)",
    border: "1px solid rgba(0,230,118,0.3)",
    color: "#00e676",
    padding: "12px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },

  panel: {
    marginTop: 24,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 24,
  },

  form: { display: "grid", gap: 22 },
  sectionTitle: { fontWeight: 900, color: "#00a8e8", marginTop: 10 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
  },

  field: { display: "flex", flexDirection: "column", gap: 6 },
  noteField: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700 },
  input: {
    padding: "12px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    width: "100%",
    boxSizing: "border-box" as const,
  },

  check: { fontSize: 14 },

  notice: {
    fontSize: 12,
    color: "#9ca3af",
    borderLeft: "3px solid #00a8e8",
    paddingLeft: 10,
  },

  primaryBtn: {
    marginTop: 20,
    padding: "16px",
    borderRadius: 16,
    background: "linear-gradient(135deg,#00a8e8,#1fb6ff)",
    fontWeight: 900,
    color: "#001018",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    opacity: 1,
  },

  footer: {
    padding: "30px 56px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 40,
  },
  footerInner: { display: "flex", justifyContent: "space-between" },
  footerMuted: { fontSize: 13, color: "#9ca3af" },
  footerLinks: { display: "flex", gap: 16 },
  footerLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },
};
