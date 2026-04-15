"use client";
import { useState, useEffect } from "react";

type DD214Status = {
  status: "none" | "pending" | "approved" | "rejected";
  discount_active?: boolean;
  submitted_at?: string;
};

export default function DD214Page() {
  const [data, setData] = useState<DD214Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dd214")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ status: "none" }))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    none: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎖️</span>
          <h1 className="text-3xl font-bold text-gray-900">
            Veteran Discount Status
          </h1>
        </div>
        <p className="text-gray-600 mb-8">
          Upload your DD-214 to verify veteran status and receive a permanent
          30% discount on your membership.
        </p>

        {loading ? (
          <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm h-32" />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Verification Status
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    statusColor[data?.status ?? "none"]
                  }`}
                >
                  {data?.status ?? "none"}
                </span>
              </div>

              {data?.status === "approved" && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-semibold text-green-800 text-lg">
                    ✅ 30% Veteran Discount Active
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Your DD-214 has been verified. Discount applied to your
                    account permanently.
                  </p>
                </div>
              )}

              {data?.status === "pending" && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-semibold text-yellow-800">
                    Document Under Review
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Typical review time is 1–3 business days. You will be
                    notified when approved.
                  </p>
                </div>
              )}

              {data?.status === "rejected" && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-semibold text-red-800">
                    Document Not Accepted
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    The submitted document could not be verified. Please
                    resubmit a clear copy of your DD-214.
                  </p>
                </div>
              )}

              {(data?.status === "none" || data?.status === "rejected") && (
                <a
                  href="/veteran-discount"
                  className="mt-4 block w-full text-center bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Upload DD-214 Document
                </a>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                About the Veteran Discount
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span>💰</span>
                  <span>30% off all membership tiers, forever</span>
                </li>
                <li className="flex gap-2">
                  <span>📄</span>
                  <span>Requires a valid DD-214 (Certificate of Release)</span>
                </li>
                <li className="flex gap-2">
                  <span>🔒</span>
                  <span>Document reviewed and securely stored</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>One-time verification — applies to renewals too</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
