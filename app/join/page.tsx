"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";   // Change this path if your supabase client is elsewhere

function JoinInner() {
  const params = useSearchParams();
  const ref = params.get("ref");

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState<string>("");

  // Fleet tiers
  const fleetTiers = [
    {
      id: "fleet_starter",
      label: "Fleet Starter",
      price: "$29.99",
      period: "/mo",
      description: "Up to 5 escorts",
      priceId: "price_1TMUvjLmfugPCRbAa1HHd7f3",
    },
    {
      id: "fleet_plus",
      label: "Fleet Plus",
      price: "$49.99",
      period: "/mo",
      description: "Up to 10 escorts",
      priceId: "price_1TMUwaLmfugPCRbAxwDBbslg",
    },
    {
      id: "fleet_pro",
      label: "Fleet Pro Unlimited",
      price: "$99.99",
      period: "/mo",
      description: "Unlimited escorts • BEST VALUE",
      priceId: "price_1TMT9fLmfugPCRbA0Tu65Ui0",
      isBest: true,
    },
  ];

  const handleSelectTier = (priceId: string) => {
    setLoading(priceId);
    startCheckout(priceId);
  };

  async function startCheckout(priceId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/signin?join=1&priceId=${encodeURIComponent(priceId)}`;
        return;
      }

      // Real checkout logic goes here later
      alert(`Starting checkout for Fleet plan: ${priceId}`);

    } catch (error) {
      console.error(error);
      alert("Failed to start checkout");
    } finally {
      setLoading("");
    }
  }

  // Store referral code if present
  if (ref) {
    sessionStorage.setItem("oeh_ref_code", ref);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join Oversize Escort Hub</h1>
          <p className="text-xl text-zinc-400">Choose your membership type</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Individual Member */}
          <div 
            onClick={() => window.location.href = "/signin?join=1"}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 cursor-pointer hover:border-white/50 transition-all hover:-translate-y-1"
          >
            <h2 className="text-3xl font-semibold mb-4">Individual</h2>
            <p className="text-zinc-400 mb-8 text-lg">Browse escorts and connect as a regular user.</p>
            <button className="w-full py-4 bg-white text-black font-semibold rounded-2xl text-lg">
              Join as Individual
            </button>
          </div>

          {/* Fleet Manager */}
          <div className="bg-zinc-900 border-2 border-blue-600 rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute top-6 right-6 bg-blue-600 text-white text-xs px-5 py-1.5 rounded-full font-bold">
              FLEET
            </div>

            <h2 className="text-3xl font-semibold mb-3">Fleet Manager</h2>
            <p className="text-zinc-400 mb-10">Manage multiple escorts under one account</p>

            <div className="space-y-4">
              {fleetTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => handleSelectTier(tier.priceId)}
                  disabled={loading === tier.priceId}
                  className={`w-full p-6 rounded-2xl border text-left transition-all group
                    ${tier.isBest 
                      ? 'border-yellow-500 bg-zinc-950' 
                      : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-xl mb-1">{tier.label}</div>
                      <div className="text-zinc-400">{tier.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{tier.price}</div>
                      <div className="text-sm text-zinc-500">{tier.period}</div>
                    </div>
                  </div>

                  {tier.isBest && (
                    <div className="mt-3 text-yellow-500 text-sm font-medium">BEST VALUE RECOMMENDED</div>
                  )}

                  <div className="mt-5 text-blue-500 font-medium group-hover:underline">
                    {loading === tier.priceId ? "Processing..." : "Select Plan →"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-zinc-500 mt-12">
          Already have an account?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">Sign in here</a>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center">Loading...</div>}>
      <JoinInner />
    </Suspense>
  );
}