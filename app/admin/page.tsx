"use client";
import { useEffect, useState } from "react";

interface Submission { id: string; user_id: string; pdf_url: string; status: string; created_at: string; type: string; }

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bgc" | "dd214" | "cert">("bgc");

  useEffect(() => {
    const endpoints: Record<string, string> = {
      bgc: "/api/bgc-badge/approve?list=true",
      dd214: "/api/veteran/dd214-submit?list=true",
      cert: "/api/escort/cert-upload?list=true",
    };
    setLoading(true);
    fetch(endpoints[tab]).then(r => r.json()).then(d => { setSubmissions(d.submissions ?? []); setLoading(false); });
  }, [tab]);

  async function approve(id: string, action: "approve" | "deny") {
    await fetch("/api/bgc-badge/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: id, action }) });
    setSubmissions(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-400 mb-6">Review and approve submitted verifications</p>
        <div className="flex gap-2 mb-6">
          {(["bgc", "dd214", "cert"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg font-medium transition ${tab === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              {t === "bgc" ? "Background Checks" : t === "dd214" ? "DD-214 Veteran" : "Escort Certs"}
            </button>
          ))}
        </div>
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loading ? <p className="p-6 text-gray-400">Loading submissions...</p> :
            submissions.length === 0 ? <p className="p-6 text-gray-400">No pending submissions.</p> :
            <table className="w-full">
              <thead className="bg-gray-700"><tr>
                <th className="p-4 text-left">User ID</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Date</th><th className="p-4 text-left">PDF</th><th className="p-4 text-left">Actions</th>
              </tr></thead>
              <tbody>{submissions.map(s => (
                <tr key={s.id} className="border-t border-gray-700">
                  <td className="p-4 font-mono text-sm">{s.user_id?.slice(0,8)}...</td>
                  <td className="p-4"><span className="px-2 py-1 rounded text-xs bg-yellow-900 text-yellow-300">{s.status}</span></td>
                  <td className="p-4 text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="p-4"><a href={s.pdf_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">View PDF</a></td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => approve(s.id, "approve")} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Approve</button>
                    <button onClick={() => approve(s.id, "deny")} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">Deny</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}