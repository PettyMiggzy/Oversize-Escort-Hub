'use client';

import { useState } from 'react';

interface Submission {
  id: string;
  status: string;
  created_at: string;
  pdf_url: string;
  // Add other fields if needed
}

export default function AdminPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Handle Approve / Deny for BGC, DD214, and Certs
  const handleAction = async (id: string, action: "approve" | "deny", type: "bgc" | "dd214" | "cert") => {
    if (loadingId) return;

    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/${type}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Submission ${action}d successfully!`);
        window.location.reload();
      } else {
        alert(data.error || `Failed to ${action} submission`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  // TODO: Replace this with your real data fetching (Supabase, etc.)
  const submissions: Submission[] = [
    // Example data - remove or replace with real fetch
    // {
    //   id: "123",
    //   status: "pending",
    //   created_at: "2026-04-15",
    //   pdf_url: "https://example.com/pdf.pdf"
    // }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Submissions</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">PDF</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800">
                <td className="p-4 font-mono text-sm">{s.id}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded text-xs bg-yellow-900 text-yellow-300">
                    {s.status}
                  </span>
                </td>
                <td className="p-4 text-gray-400">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <a 
                    href={s.pdf_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-400 hover:underline"
                  >
                    View PDF
                  </a>
                </td>
                <td className="p-4 flex gap-2">
                  <button 
                    onClick={() => handleAction(s.id, "approve", "bgc")}
                    disabled={loadingId === s.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium transition"
                  >
                    {loadingId === s.id ? "Processing..." : "Approve"}
                  </button>
                  
                  <button 
                    onClick={() => handleAction(s.id, "deny", "bgc")}
                    disabled={loadingId === s.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium transition"
                  >
                    {loadingId === s.id ? "Processing..." : "Deny"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {submissions.length === 0 && (
          <p className="text-center text-gray-400 py-12">No submissions found.</p>
        )}
      </div>
    </div>
  );
}