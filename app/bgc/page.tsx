"use client";
import { useState, useEffect } from "react";

type BadgeStatus = {
  status: "none" | "pending" | "approved" | "rejected";
  submitted_at?: string;
  approved_at?: string;
};

export default function BGCPage() {
  const [status, setStatus] = useState<BadgeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bgc")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ status: "none" }))
      .finally(() => setLoading(false));
  }, []);

  const badgeColor: Record<string, string> = {
    none: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Background Check Badge
        </h1>
        <p className="text-gray-600 mb-8">
          Verified members display a BGC badge on their profile, building trust
          with loads and carriers.
        </p>

        {loading ? (
          <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm h-32" />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Badge Status
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  badgeColor[status?.status ?? "none"]
                }`}
              >
                {status?.status ?? "none"}
              </span>
            </div>

            {status?.status === "approved" && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-semibold text-green-800">
                    BGC Badge Active
                  </p>
                  <p className="text-sm text-green-600">
                    Approved{" "}
                    {status.approved_at
                      ? new Date(status.approved_at).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              </div>
            )}

            {status?.status === "pending" && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="font-semibold text-yellow-800">
                  Under Review
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your submission is being reviewed. Typical turnaround is 1–2
                  business days.
                </p>
              </div>
            )}

            {status?.status === "rejected" && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="font-semibold text-red-800">
                  Submission Rejected
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Your previous submission was not accepted. Please resubmit
                  with a valid document.
                </p>
              </div>
            )}

            {(status?.status === "none" || status?.status === "rejected") && (
              <div className="mt-4 space-y-3">
                <a
                  href="/bgc-badge"
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Submit Background Check
                </a>
                <a
                  href="/bgc-checkout"
                  className="block w-full text-center border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition"
                >
                  Pay for BGC Badge — $9.99
                </a>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            What is a BGC Badge?
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span>🔍</span>
              <span>Identity verified against government-issued ID</span>
            </li>
            <li className="flex gap-2">
              <span>🛡️</span>
              <span>Criminal background screened</span>
            </li>
            <li className="flex gap-2">
              <span>⭐</span>
              <span>Badge displayed on your public profile</span>
            </li>
            <li className="flex gap-2">
              <span>💰</span>
              <span>One-time fee of $9.99</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
