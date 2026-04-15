"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BGCBadgePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    const res = await fetch("/api/bgc-badge/submit", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setStatus("✓ Background check submitted! ID: " + data.submissionId);
    else setStatus("Error: " + data.error);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">BGC Badge Submission</h1>
        <p className="text-gray-400 mb-8">Submit your background check PDF to earn a verified badge on your profile.</p>
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Background Check PDF</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>
          {status && <p className={status.startsWith("✓") ? "text-green-400" : "text-red-400"}>{status}</p>}
          <button type="submit" disabled={!file || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
            {loading ? "Submitting..." : "Submit Background Check"}
          </button>
        </form>
        <div className="mt-6 bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Why Get a BGC Badge?</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✓ Builds trust with shippers and carriers</li>
            <li>✓ Displayed on your public profile</li>
            <li>✓ Required for Pro tier access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}