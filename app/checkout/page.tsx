"use client";
import { useState } from "react";
import { FREE_LAUNCH } from "@/lib/free-launch";
import WebOnly from '@/components/WebOnly'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  priceId: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "p_evo_member",
    name: "P/EVO Member",
    price: "$19.99",
    period: "/mo",
    priceId: "P_EVO_MEMBER",
    description: "For independent pilot car operators and escorts.",
    features: [
      "Up to 5 load postings/month",
      "Fleet search access",
      "FMCSA carrier lookup",
      "Veteran discount eligible",
    ],
  },
  {
    id: "p_evo_pro",
    name: "Pro Member",
    price: "$29.99",
    period: "/mo",
    priceId: "P_EVO_PRO",
    description: "For full-time escorts and high-volume operators.",
    highlight: true,
    features: [
      "Unlimited load postings",
      "Priority listing in search",
      "SMS job alerts (coming soon)",
      "Push notifications",
      "Veteran discount eligible",
    ],
  },
  {
    id: "fleet_pro",
    name: "Fleet Pro",
    price: "$99.99",
    period: "/mo",
    priceId: "FLEET_PRO",
    description: "For escort companies managing multiple vehicles.",
    features: [
      "Everything in Pro",
      "Up to 10 fleet vehicles",
      "Fleet dashboard & tracking",
      "Team member accounts",
      "Dedicated support",
    ],
  },
];

function CheckoutPageInner() {
  const [selected, setSelected] = useState<string>("p_evo_pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS.find((p) => p.id === selected)!;

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/signin?redirect=${encodeURIComponent("/checkout")}`;
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, productType: plan.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap" style={{ maxWidth: 860 }}>
        <PageTitle
          eyebrow="Checkout"
          title="Choose your plan"
          lead={FREE_LAUNCH ? "Plans are free while we launch: every feature is unlocked for your account, no card needed. Sponsored zones are a one-time purchase." : "All plans include core platform access. Cancel anytime."}
        />

        <div className="ui-fit" style={{ marginBottom: 24 }}>
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={selected === p.id ? "ui-card warn" : "ui-card"}
              style={{ textAlign: "left", cursor: "pointer", color: "inherit", font: "inherit" }}
            >
              {p.highlight && (
                <span className="ui-badge orange" style={{ marginBottom: 8 }}>
                  Most popular
                </span>
              )}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span className="ui-v">{p.price}</span>
                <span className="ui-note">{p.period}</span>
              </div>
              <p style={{ fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{p.name}</p>
              <p className="ui-note">{p.description}</p>
            </button>
          ))}
        </div>

        <div className="ui-card" style={{ marginBottom: 16 }}>
          <h2>{plan.name} includes:</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.features.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ui-text)", fontSize: 14 }}>
                <span style={{ color: "var(--ui-green)", fontWeight: 700 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="ui-err" style={{ marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="ui-btn block"
        >
          {loading
            ? "Redirecting to Stripe..."
            : `Subscribe to ${plan.name} — ${plan.price}/mo`}
        </button>

        <p className="ui-note" style={{ textAlign: "center", marginTop: 16 }}>
          Secured by Stripe · Cancel anytime
        </p>

        <p className="ui-note" style={{ textAlign: "center", marginTop: 12 }}>
          Veteran? Upload your DD-214 at{" "}
          <a href="/dd214" className="ui-link">
            /dd214
          </a>{" "}
          before checkout — approved accounts get 30% off automatically.
        </p>
      </div>
    </div>
  );
}


export default function CheckoutPage() {
  return <WebOnly><CheckoutPageInner /></WebOnly>
}
