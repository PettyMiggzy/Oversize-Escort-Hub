"use client";
import { useState } from "react";

export default function EscortCertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [certType, setCertType] = useState("pilot_car");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("cert", file);
    formData.append("cert_type", certType);
    const res = await fetch("/api/escort/cert-upload", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setStatus("✓ Certificate uploaded! ID: " + data.certId);
    else setStatus("Error: " + data.error);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🚗 Escort Certification Upload</h1>
        <p className="text-gray-400 mb-8">Upload your pilot car or escort vehicle certifications</p>
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Certification Type</label>
            <select value={certType} onChange={e => setCertType(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white">
              <option value="pilot_car">Pilot Car Operator</option>
              <option value="escort_vehicle">Escort Vehicle</option>
              <option value="oversize_permit">Oversize Permit Runner</option>
              <option value="state_cert">State Certification</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Certificate (PDF)</label>
            <input type="file" accept=".pdf,.jpg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-700" />
          </div>
          {status && <p className={status.startsWith("✓") ? "text-green-400" : "text-red-400"}>{status}</p>}
          <button type="submit" disabled={!file || loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
            {loading ? "Uploading..." : "Upload Certificate"}
          </button>
        </form>
        <div className="mt-6 bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Accepted Certifications</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✓ State-issued pilot car operator licenses</li>
            <li>✓ Federal escort vehicle permits</li>
            <li>✓ OSHA/ATSSA certifications</li>
            <li>✓ Insurance certificates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}