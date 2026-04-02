"use client";
import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#ccc", fontFamily: "sans-serif" }}>
      {/* Nav bar */}
      <div style={{ background: "#0f0f0f", borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "1px solid #333", color: "#888", fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: ".1em", padding: "6px 14px", cursor: "pointer", borderRadius: 2 }}>
          ← BACK
        </button>
        <span style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90" }}>OVERSIZE ESCORT HUB</span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#f90", marginBottom: 10 }}>OUR STORY</div>
          <h1 style={{ fontSize: 40, color: "#fff", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            Built by someone who<br />lived every side of this industry.
          </h1>
          <p style={{ fontSize: 15, color: "#888", maxWidth: 560 }}>
            We did not build this platform from behind a desk. We built it from the road.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 64, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".15em", color: "#f90", marginBottom: 16 }}>THE FOUNDER</div>
            <h2 style={{ fontSize: 24, color: "#fff", marginBottom: 20 }}>Brian Ahmed</h2>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              Before building Oversize Escort Hub, Brian Ahmed spent years behind the wheel — running LTL dry van freight in a 53-foot trailer across the country. He knows what it means to live on the road: the long hours, the tight schedules, and the logistics that have to come together perfectly every single run.
            </p>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              From there, Brian transitioned into working as a licensed pilot car escort — running lead and chase for oversize loads and seeing firsthand how broken the system was for finding reliable, verified escorts quickly. Carriers wasting time chasing down escort companies. Escorts driving home empty because they had no way to find return loads. No transparency. No verification. No trust.
            </p>
            <p style={{ lineHeight: 1.8, marginBottom: 16 }}>
              He also brings a background in law enforcement — which directly shapes how Oversize Escort Hub approaches identity verification, background checks, and accountability on the platform.
            </p>
            <p style={{ lineHeight: 1.8 }}>
              Every feature on this platform was built to solve a problem Brian actually experienced. That is not something you can fake.
            </p>
          </div>
          <div>
            <div style={{ background: "rgba(249,144,0,0.06)", border: "1px solid rgba(249,144,0,0.2)", borderRadius: 8, padding: 28, marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: ".15em", color: "#f90", marginBottom: 12 }}>BRIAN'S BACKGROUND</div>
              {[
                ["🚛", "LTL Dry Van Driver — 53ft"],
                ["🚗", "Licensed Pilot Car / P/EVO Escort"],
                ["🛡️", "Law Enforcement Background"],
                ["💻", "Founder & CEO, Oversize Escort Hub"],
              ].map(([icon, label]) => (
                <div key={String(label)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#ddd" }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 24 }}>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.7, fontStyle: "italic" }}>
                "I built the platform I wished existed when I was out there doing it. No middlemen, no commissions, no guessing. Just verified escorts, real loads, and a system that works the way this industry actually works."
              </div>
              <div style={{ marginTop: 16, fontSize: 10, color: "#f90", letterSpacing: ".1em" }}>— BRIAN AHMED, FOUNDER</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 56, marginBottom: 56 }}>
          <div style={{ fontSize: 10, letterSpacing: ".15em", color: "#f90", marginBottom: 16 }}>OUR MISSION</div>
          <h2 style={{ fontSize: 28, color: "#fff", marginBottom: 24, maxWidth: 600 }}>
            A marketplace built for the people who keep oversize loads moving.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {[
              ["No Commissions", "Carriers and escorts keep 100% of what they negotiate. We charge a flat subscription. That is it."],
              ["Verified Escorts", "Every escort on the platform goes through identity verification and optional background check review by Brian personally."],
              ["Real Connections", "Direct contact between carriers and escorts. No middlemen, no dispatchers taking a cut."],
            ].map(([title, desc]) => (
              <div key={String(title)} style={{ padding: 20, background: "rgba(255,255,255,.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 10 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: ".15em", color: "#f90", marginBottom: 12 }}>GET IN TOUCH</div>
          <p style={{ marginBottom: 8 }}>Questions, partnerships, or feedback — we want to hear from you.</p>
          <a href="mailto:support@oversize-escort-hub.com" style={{ color: "#f90", fontSize: 15 }}>support@oversize-escort-hub.com</a>
        </div>
      </div>
    </div>
  );
}
