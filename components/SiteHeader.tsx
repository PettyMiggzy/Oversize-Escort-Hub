"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type NavItem = { label: string; href: string; also?: string[] }
const NAV: NavItem[] = [
  { label: "Find Loads",    href: "/flat-rate", also: ["/open-loads", "/bid-board"] },
  { label: "Find Escorts",  href: "/find-escorts" },
  { label: "Post a Load",   href: "/post-load", also: ["/quick-post"] },
  { label: "How it works",  href: "/how-it-works" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name?: string; avatar?: string | null } | null>(null);
  const [windowWidth, setWindowWidth] = useState(1200);
  const pathname = usePathname();

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
  const navHref = (n: NavItem) => (n.href === "/post-load" && !userProfile ? "/quick-post" : n.href);
  const isActive = (n: NavItem) => pathname === n.href || (n.also ?? []).includes(pathname);

  const navContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    background: "rgba(8,9,12,0.82)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "0 24px",
    gap: 20,
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  const navLinkStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    color: "#a3acba",
    padding: "0 8px",
    height: 64,
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
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    marginRight: 8,
  };

  const ctaAreaStyle: React.CSSProperties = {
    display: isMobile ? "none" : "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
  };

  const btnGhostStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: "#e6e9ef",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "9px 20px",
    cursor: "pointer",
    textDecoration: "none",
  };

  const btnPrimeStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    color: "#120800",
    background: "#ff6a13",
    border: "none",
    borderRadius: 999,
    padding: "9px 20px",
    boxShadow: "0 6px 22px rgba(255,106,19,0.35)",
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
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    padding: "12px 24px",
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
          <Link href="/" style={logoStyle} aria-label="Oversize Escort Hub home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark.png" alt="Oversize Escort Hub" style={{ height: 36, width: "auto" }} />
          </Link>

          {/* Desktop nav links */}
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                {NAV.map((n) => (
                  <Link key={n.label} href={navHref(n)} style={isActive(n) ? { ...navLinkStyle, color: "#fff", borderBottom: "2px solid #ff6a13" } : navLinkStyle}>
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
          <><Link href="/signin" style={btnGhostStyle}>Sign in</Link><Link href="/signin?mode=signup" style={btnPrimeStyle}>Get started</Link></>
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
              href={navHref(n)}
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
            <><Link href="/signin" style={{ ...btnGhostStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Sign in</Link><Link href="/signin?mode=signup" style={{ ...btnPrimeStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Get started</Link></>
          )}
          </div>
        </div>
      </header>
    </>
  );
}
