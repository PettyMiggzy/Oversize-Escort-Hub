"use client";
import { useState, useEffect } from "react";

export default function PushPage() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  async function subscribe() {
    setLoading(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        setMessage("Already subscribed.");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
        setPermission(Notification.permission);
        setMessage("✅ Push notifications enabled for this device.");
      } else {
        const d = await res.json();
        setMessage(d.error ?? "Failed to save subscription.");
      }
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        setSubscribed(false);
        setMessage("🔕 Notifications disabled for this device.");
      }
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Push Notifications
        </h1>
        <p className="text-gray-600 mb-8">
          Get real-time alerts for new loads, job matches, and account updates.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {!supported ? (
            <div className="text-center py-6">
              <span className="text-4xl">⚠️</span>
              <p className="mt-3 text-gray-600">
                Push notifications are not supported in this browser.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Try Chrome or Firefox on desktop or Android.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-medium text-gray-900">
                    Notifications on this device
                  </p>
                  <p className="text-sm text-gray-500">
                    Browser permission:{" "}
                    <span
                      className={
                        permission === "granted"
                          ? "text-green-600"
                          : permission === "denied"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }
                    >
                      {permission}
                    </span>
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full ${
                    subscribed ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>

              {permission === "denied" ? (
                <div className="p-4 bg-red-50 rounded-lg text-sm text-red-700">
                  Notifications are blocked. Enable them in your browser site
                  settings, then return here.
                </div>
              ) : subscribed ? (
                <button
                  onClick={unsubscribe}
                  disabled={loading}
                  className="w-full border border-red-400 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? "Working..." : "Disable Notifications"}
                </button>
              ) : (
                <button
                  onClick={subscribe}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? "Enabling..." : "Enable Notifications"}
                </button>
              )}

              {message && (
                <p className="mt-4 text-sm text-center text-gray-700">
                  {message}
                </p>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            What you'll receive
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span>🚚</span>
              <span>New load postings matching your routes</span>
            </li>
            <li className="flex gap-2">
              <span>💬</span>
              <span>Messages from load coordinators</span>
            </li>
            <li className="flex gap-2">
              <span>✅</span>
              <span>BGC and DD-214 verification updates</span>
            </li>
            <li className="flex gap-2">
              <span>💳</span>
              <span>Payment and subscription alerts</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
