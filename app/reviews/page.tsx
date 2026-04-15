"use client";
import { useEffect, useState } from "react";

interface Review { id: string; reviewer_name: string; rating: number; comment: string; created_at: string; load_id: string; }

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ load_id: "", rating: 5, comment: "", reviewee_id: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/reviews").then(r => r.json()).then(d => { setReviews(d.reviews ?? []); setLoading(false); });
  }, []);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const data = await res.json();
      setReviews(prev => [data.review, ...prev]);
      setForm({ load_id: "", rating: 5, comment: "", reviewee_id: "" });
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">⭐ Reviews</h1>
        <p className="text-gray-400 mb-8">Rate and review carriers, escorts, and partners</p>
        <form onSubmit={submitReview} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4">
          <h2 className="text-xl font-semibold">Write a Review</h2>
          <input placeholder="Load ID" value={form.load_id} onChange={e => setForm({...form, load_id: e.target.value})}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white" />
          <div className="flex items-center gap-3">
            <label className="text-gray-300">Rating:</label>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setForm({...form, rating: n})}
                className={`text-2xl transition ${n <= form.rating ? "text-yellow-400" : "text-gray-600"}`}>★</button>
            ))}
          </div>
          <textarea placeholder="Your review..." value={form.comment} onChange={e => setForm({...form, comment: e.target.value})}
            rows={3} className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white resize-none" />
          <button type="submit" disabled={submitting || !form.comment} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
        <div className="space-y-4">
          {loading ? <p className="text-gray-400">Loading...</p> : reviews.map(r => (
            <div key={r.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{r.reviewer_name || "Anonymous"}</span>
                <div className="flex text-yellow-400">{Array.from({length: r.rating}).map((_, i) => <span key={i}>★</span>)}</div>
              </div>
              <p className="text-gray-300">{r.comment}</p>
              <p className="text-gray-500 text-sm mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}