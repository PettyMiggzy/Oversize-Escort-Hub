"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const PRICES = {
    member:      "price_1TF00LLmfugPCRbAl6SF0Oup",
    pro:         "price_1TF021LmfugPCRbA7CGgLhC0",
    pevo_member: "price_1TF0D4LmfugPCRbAd4hM022R",
    pevo_pro:    "price_1TF0D1LmfugPCRbAPWsN2K5x",
    bgc:         "price_1TF0EILmfugPCRbAvM6Q5rhW",
};

async function startCheckout(priceId: string, setLoading: (v: string) => void) {
    setLoading(priceId);
    try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { window.location.href = "/signin?redirect=pricing"; return; }
          const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priceId, userId: session.user.id }),
          });
          const { url, error } = await res.json();
          if (error) { alert("Error: " + error); return; }
          window.location.href = url;
    } catch (e) {
          alert("Checkout failed");
    } finally {
          setLoading("");
    }
}

export default function PricingPage() {
    const [loading, setLoading] = useState("");
    const cards = [
      {
              label: "Free Trial",
              badge: null,
              price: "Free",
              period: "",
              color: "var(--t2)",
              features: [
                        "Create escort profile",
                        "See load boards (blurred preview)",
                        "Preview all tools",
                        "No bidding or contact info access",
                      ],
              cta: null,
              priceId: null,
      },
      {
              label: "Member",
              badge: "ESCORT",
              price: "$19.99",
              period: "/mo",
              color: "var(--gr)",
              features: [
                        "Full load board access (60s after Pro)",
                        "Bid on loads",
                        "See carrier contact info",
                        "Push notifications",
                        "Permit directory — all 50 states + Canada",
                        "Reviews system",
                      ],
              cta: "Get Member",
              priceId: PRICES.member,
      },
      {
              label: "Pro",
              badge: "ESCORT",
              price: "$29.99",
              period: "/mo",
              color: "var(--or)",
              features: [
                        "Instant load access — 60s head start over Member",
                        "SMS alerts when loads drop",
                        "SMS load posting",
                        "Deadhead Minimizer",
                        "Escort Availability Board",
                        "Fleet Manager — up to 5 escorts",
                        "First cert verification free",
                        "Priority listing + Invoice Generator",
                      ],
              cta: "Get Pro",
              priceId: PRICES.pro,
      },
      {
              label: "Carrier",
              badge: "CARRIER",
              price: "Free",
              period: "Always",
              color: "var(--am)",
              features: [
                        "Post unlimited loads — all 3 boards",
                        "FMCSA verified badge",
                        "Permit directory",
                        "Carrier dashboard",
                      ],
              cta: "Sign Up Free",
              priceId: null,
      },
        ];
    return (
          <div className="section">
                <div style={{ marginBottom: 24 }}>
                        <h1 className="bb" style={{ fontSize: 28, marginBottom: 8 }}>Pricing</h1>
                        <p className="mo" style={{ fontSize: 13, color: "var(--t2)" }}>No commissions. No middlemen. Flat subscription only.</p>
                </div>
                <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 32 }}>
                  {cards.map((c) => (
                      <div key={c.label} style={{ background: "var(--p2)", border: `2px solid ${c.color}`, borderRadius: 12, padding: "24px 20px", display: "flex", flexDirection: "column" }}>
                        {c.badge && <span style={{ fontSize: 10, fontWeight: 700, background: c.color, color: "#000", padding: "2px 8px", borderRadius: 99, alignSelf: "flex-start", marginBottom: 8 }}>{c.badge}</span>}
                                  <div className="bb" style={{ fontSize: 20, marginBottom: 4 }}>{c.label}</div>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                                                <span style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.price}</span>
                                    {c.period && <span style={{ fontSize: 13, color: "var(--t2)" }}>{c.period}</span>}
                                  </div>
                                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", flex: 1 }}>
                                    {c.features.map((f) => (
                                        <li key={f} style={{ fontSize: 13, color: "var(--t1)", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}><span style={{ color: c.color }}>+</span>{f}</li>li>
                                      ))}
                                  </ul>
                        {c.cta && c.priceId ? (
                                      <button onClick={() => startCheckout(c.priceId!, setLoading)} disabled={loading === c.priceId} style={{ background: c.color, color: "#000", border: "none", borderRadius: 6, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: loading === c.priceId ? 0.6 : 1 }}>{loading === c.priceId ? "Loading..." : c.cta}</button>button>
                                    ) : c.cta ? (
                                      <button onClick={() => window.location.href = "/join?role=carrier"} style={{ width: "100%", background: "var(--l2)", color: "var(--t1)", border: "none", borderRadius: 6, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{c.cta}</button>button>
                                    ) : null}
                      </div>
                    ))}
                </div>
            {/* BGC Badge */}
                <div style={{ maxWidth: 480, margin: "0 auto", background: "var(--p2)", border: "1px solid var(--l2)", borderRadius: 12, padding: "28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                        <div>
                                  <span style={{ fontSize: 11, fontWeight: 700, background: "#1e3a5f", color: "#60a5fa", padding: "3px 10px", borderRadius: 99 }}>BACKGROUND CHECK</span>
                                  <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 10, marginBottom: 4 }}>BGC Badge</h3>
                                  <p style={{ fontSize: 13, color: "var(--t2)", maxWidth: 300 }}>One-time background check. Admin reviews manually. Badge appears on your profile upon approval.</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--t1)" }}>$9.99</div>
                                  <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 12 }}>one-time</div>
                                  <button onClick={() => startCheckout(PRICES.bgc, setLoading)} disabled={loading === PRICES.bgc} style={{ background: "#1e3a5f", color: "#60a5fa", border: "none", borderRadius: 6, padding: "10px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading === PRICES.bgc ? 0.6 : 1 }}>{loading === PRICES.bgc ? "Loading..." : "Get BGC Badge"}</button>button>
                        </div>
                </div>
          </div>
        );
}</div>
