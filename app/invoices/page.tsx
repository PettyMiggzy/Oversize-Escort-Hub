"use client";
import { useEffect, useState } from "react";

interface Invoice { id: string; amount: number; status: string; created_at: string; load_id: string; }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ load_id: "", amount: "", recipient_email: "" });

  useEffect(() => {
    fetch("/api/invoices").then(r => r.json()).then(d => { setInvoices(d.invoices ?? []); setLoading(false); });
  }, []);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/invoices/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setCreating(false);
    if (res.ok) { alert("Invoice created! ID: " + data.invoiceId); setForm({ load_id: "", amount: "", recipient_email: "" }); }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Invoices</h1>
        <form onSubmit={createInvoice} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4">
          <h2 className="text-xl font-semibold">Create Invoice</h2>
          <input placeholder="Load ID" value={form.load_id} onChange={e => setForm({...form, load_id: e.target.value})}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" />
          <input type="number" placeholder="Amount ($)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" />
          <input type="email" placeholder="Recipient Email" value={form.recipient_email} onChange={e => setForm({...form, recipient_email: e.target.value})}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" />
          <button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg">
            {creating ? "Creating..." : "Create Invoice"}
          </button>
        </form>
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loading ? <p className="p-6 text-gray-400">Loading...</p> : invoices.length === 0 ? <p className="p-6 text-gray-400">No invoices yet.</p> : (
            <table className="w-full">
              <thead className="bg-gray-700"><tr>
                <th className="p-4 text-left">ID</th><th className="p-4 text-left">Amount</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Date</th>
              </tr></thead>
              <tbody>{invoices.map(inv => (
                <tr key={inv.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4 font-mono text-sm">{inv.id.slice(0,8)}...</td>
                  <td className="p-4">${inv.amount}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${inv.status === "paid" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>{inv.status}</span></td>
                  <td className="p-4 text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}