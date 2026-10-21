"use client";
import { useEffect, useState } from "react";
import SiteHeader from '@/components/SiteHeader';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  reviewer_name?: string;
  rating: number;
  body: string | null;
  created_at: string;
  load_id: string;
}

export default function ReviewsPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ loadId: "", rating: 5, comment: "", targetUserId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const res = await fetch(`/api/reviews?userId=${encodeURIComponent(user.id)}`);
      const d = await res.json();
      setReviews(d.reviews ?? []);
      setLoading(false);
    })();
  }, []);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loadId: form.loadId,
        targetUserId: form.targetUserId,
        rating: form.rating,
        comment: form.comment,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.review) setReviews(prev => [data.review, ...prev]);
      setForm({ loadId: "", rating: 5, comment: "", targetUserId: "" });
    } else {
      setError(data.error || "Failed to submit review");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <SiteHeader />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Reviews</h1>
        <p className="text-gray-400 mb-8">Rate and review carriers, escorts, and partners</p>
        {!userId ? (
          <p className="text-gray-400 mb-8">
            <a href="/signin?redirect=/reviews" className="text-yellow-400 underline">Sign in</a> to write or view your reviews.
          </p>
        ) : (
          <form onSubmit={submitReview} className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4">
            <h2 className="text-xl font-semibold">Write a Review</h2>
            <input
              required
              placeholder="Load ID"
              value={form.loadId}
              onChange={e => setForm({ ...form, loadId: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <input
              required
              placeholder="Reviewee user ID"
              value={form.targetUserId}
              onChange={e => setForm({ ...form, targetUserId: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <div className="flex items-center gap-3">
              <label className="text-gray-300">Rating:</label>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, rating: n })}
                  className={`text-2xl transition ${n <= form.rating ? "text-yellow-400" : "text-gray-600"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Your review..."
              value={form.comment}
              onChange={e => setForm({ ...form, comment: e.target.value })}
              rows={3}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white resize-none"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !form.loadId || !form.targetUserId}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-400">No reviews yet.</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{r.reviewer_name || "Anonymous"}</span>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-300">{r.body}</p>
                <p className="text-gray-500 text-sm mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
