"use client";
import { useState } from "react";

interface Vehicle { id: string; make: string; model: string; year: number; vin: string; status: string; }

export default function FleetSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/fleet-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.vehicles ?? []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🚛 Fleet Search</h1>
        <p className="text-gray-400 mb-8">Search oversize transport vehicles and equipment</p>
        <form onSubmit={search} className="flex gap-3 mb-8">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by make, model, VIN, or state..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-blue-500 outline-none" />
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <div className="space-y-3">
          {results.map(v => (
            <div key={v.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-gray-750">
              <div>
                <p className="font-semibold">{v.year} {v.make} {v.model}</p>
                <p className="text-gray-400 text-sm font-mono">VIN: {v.vin}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${v.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-300"}`}>
                {v.status}
              </span>
            </div>
          ))}
          {results.length === 0 && !loading && query && <p className="text-gray-400 text-center py-8">No vehicles found for &ldquo;{query}&rdquo;</p>}
        </div>
      </div>
    </div>
  );
}