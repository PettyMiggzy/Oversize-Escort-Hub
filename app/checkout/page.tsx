"use client";
import { useState } from "react";

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
      "BGC Badge eligible",
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
      "BGC Badge included",
      "SMS job alerts",
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

export default function CheckoutPage() {
  const [selected, setSelected] = useState<string>("p_evo_pro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS.find((p) => p.id === selected)!;

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 mb-8">
          All plans include core platform access. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`text-left rounded-xl border-2 p-5 transition ${
                selected === p.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } ${p.highlight ? "ring-2 ring-blue-200" : ""}`}
            >
              {p.highlight && (
                <span className="inline-block mb-2 text-xs font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  {p.price}
                </span>
                <span className="text-sm text-gray-500">{p.period}</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1">{p.name}</p>
              <p className="text-xs text-gray-500">{p.description}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {plan.name} includes:
          </h2>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-xl transition text-lg"
        >
          {loading
            ? "Redirecting to Stripe..."
            : `Subscribe to ${plan.name} — ${plan.price}/mo`}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>🔒</span>
          <span>Secured by Stripe · Cancel anytime</span>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Veteran? After subscribing, upload your DD-214 at{" "}
          <a href="/dd214" className="underline">
            /dd214
          </a>{" "}
          to apply your 30% discount.
        </p>
      </div>
    </div>
  );
}
