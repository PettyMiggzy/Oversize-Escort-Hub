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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const res = await fetch("/api/dd214");
    const d = await res.json().catch(() => ({ status: "none" }));
    setData(d);
  }

  useEffect(() => {
    refresh()
      .catch(() => setData({ status: "none" }))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/dd214", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(d.error || "Upload failed");
      } else {
        setMessage("Uploaded — pending review.");
        setFile(null);
        await refresh();
      }
    } catch {
      setMessage("Network error");
    } finally {
      setUploading(false);
    }
  }

  const statusColor: Record<string, string> = {
    none: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Veteran Discount Status
        </h1>
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
                    30% Veteran Discount Active
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Your DD-214 has been verified. Discount applied permanently.
                  </p>
                </div>
              )}

              {data?.status === "pending" && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-semibold text-yellow-800">
                    Document Under Review
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Typical review time is 1–3 business days.
                  </p>
                </div>
              )}

              {data?.status === "rejected" && (
                <div className="p-4 bg-red-50 rounded-lg mb-4">
                  <p className="font-semibold text-red-800">
                    Document Not Accepted
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Please resubmit a clear copy of your DD-214.
                  </p>
                </div>
              )}

              {(data?.status === "none" || data?.status === "rejected") && (
                <form onSubmit={handleUpload} className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-600"
                  />
                  {message && (
                    <p className={`text-sm ${message.includes("fail") || message.includes("error") || message.includes("Error") ? "text-red-600" : "text-green-700"}`}>
                      {message}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    {uploading ? "Uploading..." : "Upload DD-214 Document"}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                About the Veteran Discount
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>30% off all membership tiers, forever</li>
                <li>Requires a valid DD-214 (Certificate of Release)</li>
                <li>Document reviewed and securely stored</li>
                <li>One-time verification — applies to renewals too</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
