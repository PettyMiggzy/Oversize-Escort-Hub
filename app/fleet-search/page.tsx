"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

/** Fleet search lives in the Deadhead Minimizer (Pro). This route used to call a
 *  non-existent GET /api/fleet-search for vehicle VIN lookup — that stub is gone. */
export default function FleetSearchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pricing");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#060b16", color: "#e5e7eb" }}>
      <SiteHeader />
      <div style={{ maxWidth: 560, margin: "48px auto", padding: "0 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Fleet Manager</h1>
        <p style={{ color: "#9ca3af", marginBottom: 24 }}>
          Fleet load search is part of the Deadhead Minimizer on Pro. Redirecting to pricing…
        </p>
        <a href="/pricing" style={{ color: "#f0a500", fontWeight: 700 }}>
          View Pro plans →
        </a>
      </div>
    </div>
  );
}
