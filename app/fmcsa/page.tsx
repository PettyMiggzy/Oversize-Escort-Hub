"use client";
import { useState } from "react";

interface FMCSAData {
  verified?: boolean;
  reason?: string;
  legalName?: string;
  dotNumber?: string | number;
  mcNumber?: string | number | null;
  operatingStatus?: string;
  outOfService?: string | null;
}

export default function FMCSAPage() {
  const [dotNumber, setDotNumber] = useState("");
  const [data, setData] = useState<FMCSAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    const res = await fetch(`/api/fmcsa?dot=${encodeURIComponent(dotNumber)}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Not found");
    } else if (json.verified === false) {
      setError(json.reason || "Carrier not found");
      setData(json);
    } else {
      setData(json);
    }
    setLoading(false);
  }

  const isActive = data?.operatingStatus === "active";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">FMCSA Carrier Lookup</h1>
        <p className="text-gray-400 mb-8">Look up a carrier in the FMCSA database. This is public government data; we do not check or vouch for it.</p>
        <form onSubmit={lookup} className="flex gap-3 mb-8">
          <input
            value={dotNumber}
            onChange={e => setDotNumber(e.target.value)}
            placeholder="Enter DOT Number..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !dotNumber}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl"
          >
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </form>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {data?.verified && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">{data.legalName || "Carrier"}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">DOT Number</p>
                <p className="font-mono">{data.dotNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">MC Number</p>
                <p className="font-mono">{data.mcNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Operating Status</p>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    isActive ? "bg-blue-900 text-blue-300" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {data.operatingStatus ?? "—"}
                </span>
              </div>
              {data.outOfService && (
                <div>
                  <p className="text-gray-400 text-sm">Out of Service</p>
                  <p className="text-red-300">{data.outOfService}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
