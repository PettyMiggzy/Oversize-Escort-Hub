"use client";
import { useState } from "react";

export default function BGCCheckoutPage() {
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          BGC Badge Payment
        </h1>
        <p className="text-gray-600 mb-8">
          Secure checkout via Stripe. One-time payment — no subscription.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between py-3 border-b">
            <span className="font-medium text-gray-700">
              Background Check Verification Badge
            </span>
            <span className="font-bold text-gray-900">$9.99</span>
          </div>
          <div className="flex items-center justify-between py-3 text-sm text-gray-500">
            <span>One-time fee</span>
            <span>No recurring charges</span>
          </div>
          <div className="flex items-center justify-between py-3 border-t font-semibold">
            <span>Total</span>
            <span>$9.99</span>
          </div>
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
          {loading ? "Redirecting to Stripe..." : "Pay $9.99 — Get BGC Badge"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>🔒</span>
          <span>Secured by Stripe</span>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already paid?{" "}
          <a href="/bgc-badge" className="text-blue-600 hover:underline">
            Submit your background check documents
          </a>
        </p>
      </div>
    </div>
  );
}
