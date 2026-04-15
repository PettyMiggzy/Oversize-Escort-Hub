"use client";
import { useState } from "react";

interface FMCSAData { carrier_name: string; dot_number: string; mc_number: string; safety_rating: string; insurance_status: string; operating_status: string; }

export default function FMCSAPage() {
  const [dotNumber, setDotNumber] = useState("");
  const [data, setData] = useState<FMCSAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/fmcsa?dot=${dotNumber}`);
    const json = await res.json();
    if (res.ok) setData(json);
    else setError(json.error || "Not found");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🏛️ FMCSA Carrier Lookup</h1>
        <p className="text-gray-400 mb-8">Verify carrier safety ratings and operating status</p>
        <form onSubmit={lookup} className="flex gap-3 mb-8">
          <input value={dotNumber} onChange={e => setDotNumber(e.target.value)} placeholder="Enter DOT Number..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-blue-500 outline-none" />
          <button type="submit" disabled={loading || !dotNumber} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl">
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </form>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {data && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold">{data.carrier_name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-400 text-sm">DOT Number</p><p className="font-mono">{data.dot_number}</p></div>
              <div><p className="text-gray-400 text-sm">MC Number</p><p className="font-mono">{data.mc_number}</p></div>
              <div><p className="text-gray-400 text-sm">Safety Rating</p>
                <span className={`px-2 py-1 rounded text-sm font-medium ${data.safety_rating === "Satisfactory" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                  {data.safety_rating}
                </span>
              </div>
              <div><p className="text-gray-400 text-sm">Operating Status</p>
                <span className={`px-2 py-1 rounded text-sm font-medium ${data.operating_status === "Active" ? "bg-blue-900 text-blue-300" : "bg-gray-700 text-gray-300"}`}>
                  {data.operating_status}
                </span>
              </div>
              <div><p className="text-gray-400 text-sm">Insurance Status</p><p className="text-green-300">{data.insurance_status}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}