"use client";
import { useState } from "react";
import WebOnly from '@/components/WebOnly'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

function BGCCheckoutPageInner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bgc-checkout", { method: "POST" });
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
      <div className="ui-wrap" style={{ maxWidth: 520 }}>
        <PageTitle eyebrow="Verification" title="BGC badge payment" lead="Secure checkout via Stripe. One-time payment — no subscription." />

        <div className="ui-card" style={{ marginBottom: 16 }}>
          <div className="ui-kv">
            <span className="k">Background Check Verification Badge</span>
            <span className="v">$9.99</span>
          </div>
          <div className="ui-kv">
            <span className="k">One-time fee</span>
            <span className="v">No recurring charges</span>
          </div>
          <div className="ui-kv" style={{ borderBottom: 0 }}>
            <span className="k" style={{ color: "#fff" }}>Total</span>
            <span className="v" style={{ fontWeight: 800 }}>$9.99</span>
          </div>
        </div>

        {error && (
          <div className="ui-err" style={{ marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="ui-btn block"
        >
          {loading ? "Redirecting to Stripe..." : "Pay $9.99 — Get BGC Badge"}
        </button>

        <p className="ui-note" style={{ textAlign: "center", marginTop: 16 }}>
          Secured by Stripe
        </p>

        <p className="ui-note" style={{ textAlign: "center", marginTop: 16 }}>
          Already paid?{" "}
          <a href="/bgc-badge" className="ui-link">
            Submit your background check documents
          </a>
        </p>
      </div>
    </div>
  );
}


export default function BGCCheckoutPage() {
  return <WebOnly><BGCCheckoutPageInner /></WebOnly>
}
