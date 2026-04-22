"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NAV = [
  { label: "Flat Rate",     href: "/" },
  { label: "Open Loads",    href: "/?board=openboard" },
  { label: "Bid Board",     href: "/bid-board" },
  { label: "Find Escorts",  href: "/find-escorts" },
  { label: "Post a Load",   href: "/post-load" },
  { label: "Pricing",       href: "/pricing" },
  { label: "Verification",  href: "/verify" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name?: string; avatar?: string | null } | null>(null);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const u = data.session.user;
      supabase.from("profiles").select("full_name, avatar_url").eq("id", u.id).single()
        .then(({ data: p }) => {
          if (p) setUserProfile({ name: p.full_name, avatar: p.avatar_url });
        });
    });
  }, []);

  const isMobile = windowWidth < 900;

  const navContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    background: "rgba(6,8,10,0.98)",
    borderBottom: "1px solid #1c2229",
    padding: "0 24px",
    gap: 20,
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  const navLinkStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace',
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#6e7a88",
    padding: "0 10px",
    height: 56,
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  const hamButtonStyle: React.CSSProperties = {
    display: isMobile ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 22,
    lineHeight: 1,
    padding: 8,
    cursor: "pointer",
    marginLeft: "auto",
  };

  const logoStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace',
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#e8eaed",
    textDecoration: "none",
    whiteSpace: "nowrap",
    marginRight: 8,
  };

  const ctaAreaStyle: React.CSSProperties = {
    display: isMobile ? "none" : "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
  };

  const btnGhostStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace',
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6e7a88",
    background: "none",
    border: "1px solid #2a3340",
    borderRadius: 4,
    padding: "6px 14px",
    cursor: "pointer",
    textDecoration: "none",
  };

  const btnPrimeStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace',
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#0a0c0e",
    background: "#e8eaed",
    border: "none",
    borderRadius: 4,
    padding: "6px 14px",
    cursor: "pointer",
    textDecoration: "none",
  };

  const mobileDropdownStyle: React.CSSProperties = {
    display: open && isMobile ? "flex" : "none",
    flexDirection: "column",
    gap: 0,
    background: "rgba(6,8,10,0.98)",
    borderTop: "1px solid #1c2229",
    padding: "8px 0 16px",
  };

  const mobileLinkStyle: React.CSSProperties = {
    fontFamily: '"DM Mono", monospace',
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
    padding: "10px 24px",
    textDecoration: "none",
    background: "none",
  };

  const mobileCtaStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 24px 0",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 8,
  };

  return (
    <>
      <header>
        <nav style={navContainerStyle}>
          <Link href="/" style={logoStyle}>OEH</Link>

          {/* Desktop nav links */}
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                {NAV.map((n) => (
                  <Link key={n.label} href={n.href} style={navLinkStyle}>
                    {n.label}
                  </Link>
                ))}
              </div>
            )}

          {/* Desktop CTA */}
          <div style={ctaAreaStyle}>
        {userProfile ? (
          <Link href="/dashboard" style={btnPrimeStyle}>Dashboard</Link>
        ) : (
          <><Link href="/signin" style={btnGhostStyle}>Sign in</Link><Link href="/dashboard" style={btnPrimeStyle}>Dashboard</Link></>
        )}
          </div>

          {/* Mobile hamburger */}
          <button
            style={hamButtonStyle}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </nav>

        {/* Mobile dropdown */}
        <div style={mobileDropdownStyle}>
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              style={mobileLinkStyle}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div style={mobileCtaStyle}>
          {userProfile ? (
            <Link href="/dashboard" style={{ ...btnPrimeStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Dashboard</Link>
          ) : (
            <><Link href="/signin" style={{ ...btnGhostStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Sign in</Link><Link href="/dashboard" style={{ ...btnPrimeStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Dashboard</Link></>
          )}
          </div>
        </div>
      </header>
    </>
  );
}
