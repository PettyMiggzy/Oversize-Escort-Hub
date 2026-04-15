'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Submission {
  id: string;
  status: string;
  created_at: string;
  pdf_url: string;
  type: 'bgc' | 'dd214' | 'cert';
}

export default function AdminPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    try {
      const { data, error } = await supabase
        .from('submissions')           // ← Change this if your table name is different
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  }

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
        fetchSubmissions();        // Refresh list without full reload
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

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading submissions...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="bg-zinc-900 rounded-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">Pending Submissions</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700 text-left">
              <th className="p-4">ID</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4">PDF</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="p-4 font-mono text-sm">{s.id}</td>
                <td className="p-4 uppercase text-xs text-zinc-400">{s.type}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded text-xs bg-yellow-900 text-yellow-300">
                    {s.status}
                  </span>
                </td>
                <td className="p-4 text-gray-400">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <a href={s.pdf_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                    View PDF
                  </a>
                </td>
                <td className="p-4 flex gap-3">
                  <button 
                    onClick={() => handleAction(s.id, "approve", s.type)}
                    disabled={loadingId === s.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    {loadingId === s.id ? "Processing..." : "Approve"}
                  </button>
                  
                  <button 
                    onClick={() => handleAction(s.id, "deny", s.type)}
                    disabled={loadingId === s.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    {loadingId === s.id ? "Processing..." : "Deny"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {submissions.length === 0 && (
          <p className="text-center text-gray-400 py-16 text-lg">No pending submissions found.</p>
        )}
      </div>
    </div>
  );
}