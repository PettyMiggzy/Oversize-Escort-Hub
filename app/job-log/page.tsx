"use client";
import { useState, useEffect } from "react";

type JobLog = {
  id: string;
  notes: string | null;
  mileage: number;
  expenses: { amount?: number; label?: string }[] | null;
  logged_at: string;
  load_id: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    notes: "",
    mileage: "",
    earned: "",
    state: "",
  });

  useEffect(() => {
    fetch("/api/jobs/log")
      .then((r) => r.json())
      .then((d) => setJobs(Array.isArray(d) ? d : d.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const earned = Number(form.earned);
      const notes = [
        form.notes.trim(),
        form.state ? `State: ${form.state}` : "",
        Number.isFinite(earned) && earned > 0 ? `Earned: $${earned}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const res = await fetch("/api/jobs/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mileage: Number(form.mileage),
          notes,
          expenses:
            Number.isFinite(earned) && earned > 0
              ? [{ label: "earned", amount: earned }]
              : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to log job.");
      } else {
        setSuccess("Job logged successfully!");
        setForm({ notes: "", mileage: "", earned: "", state: "" });
        // refresh list from API shape
        const refreshed = await fetch("/api/jobs/log").then((r) => r.json());
        setJobs(refreshed.jobs ?? []);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalMiles = jobs.reduce((s, j) => s + (j.mileage ?? 0), 0);
  const totalEarned = jobs.reduce((s, j) => {
    const earned = Array.isArray(j.expenses)
      ? j.expenses
          .filter((e) => e?.label === "earned")
          .reduce((a, e) => a + (e.amount || 0), 0)
      : 0;
    return s + earned;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Log</h1>
        <p className="text-gray-600 mb-8">
          Track completed loads, mileage, and earnings.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Jobs", value: jobs.length },
            { label: "Total Miles", value: totalMiles.toLocaleString() },
            {
              label: "Total Earned",
              value: `$${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl shadow-sm p-4 text-center"
            >
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Log a Completed Load</h2>
          <form onSubmit={handleLog} className="space-y-4">
            <input
              required
              placeholder="Load description (e.g., Wide load — I-40 NM to AZ)"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                required
                type="number"
                min="0"
                placeholder="Miles"
                value={form.mileage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mileage: e.target.value }))
                }
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="Earned ($)"
                value={form.earned}
                onChange={(e) =>
                  setForm((f) => ({ ...f, earned: e.target.value }))
                }
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                required
                maxLength={2}
                placeholder="State (TX)"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))
                }
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {submitting ? "Logging..." : "Log Job"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Job History</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No jobs logged yet.
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((j) => {
                const earned = Array.isArray(j.expenses)
                  ? j.expenses
                      .filter((e) => e?.label === "earned")
                      .reduce((a, e) => a + (e.amount || 0), 0)
                  : 0;
                return (
                  <div
                    key={j.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {j.notes || "Job"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {j.mileage?.toLocaleString()} mi ·{" "}
                        {j.logged_at
                          ? new Date(j.logged_at).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      ${earned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
