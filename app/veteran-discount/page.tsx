"use client";
import { useState } from "react";

export default function VeteranDiscountPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    const res = await fetch("/api/veteran/dd214-submit", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setStatus("✓ DD-214 submitted! Submission ID: " + data.submissionId);
    else setStatus("Error: " + data.error);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🎖️</span>
          <h1 className="text-3xl font-bold">Veteran Discount Program</h1>
        </div>
        <p className="text-gray-400 mb-8">Submit your DD-214 to receive a 30% lifetime discount on all membership tiers.</p>
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4 mb-6">
          <p className="text-yellow-300 font-semibold">🎁 30% Lifetime Discount</p>
          <p className="text-yellow-200 text-sm">Applied automatically after approval (1-3 business days)</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">DD-214 Form (PDF)</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700" />
          </div>
          {status && <p className={status.startsWith("✓") ? "text-green-400" : "text-red-400"}>{status}</p>}
          <button type="submit" disabled={!file || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
            {loading ? "Submitting..." : "Submit DD-214"}
          </button>
        </form>
      </div>
    </div>
  );
}