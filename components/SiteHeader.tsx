"use client";
import { useState, useEffect } from "react";
import HideInApp from '@/components/HideInApp';
import { isNativeApp } from '@/lib/native';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type NavItem = { label: string; href: string; also?: string[] }
type NavGroup = { label: string; items: NavItem[]; signedInOnly?: string[] }

// Four things on the bar: two menus, Post a Load, Tools. Everything else lives inside them.
const GROUPS: NavGroup[] = [
  {
    label: "Find Loads",
    items: [
      { label: "Flat rate board", href: "/flat-rate" },
      { label: "Open bid board", href: "/open-loads" },
      { label: "5-minute bid board", href: "/bid-board" },
      { label: "Jobs", href: "/jobs" },
    ],
  },
  {
    label: "Pilot Cars",
    items: [
      { label: "Find pilot cars", href: "/find-escorts" },
      { label: "I'm available", href: "/available" },
    ],
    signedInOnly: ["/available"],
  },
  {
    label: "Tools",
    items: [
      { label: "Invoice maker", href: "/tools/invoice" },
      { label: "Expense tracker", href: "/tools/expenses" },
      { label: "Permit directory", href: "/tools/permits" },
      { label: "Weather", href: "/weather" },
      { label: "All tools", href: "/tools" },
    ],
  },
];
const POST: NavItem = { label: "Post a Load", href: "/post-load", also: ["/quick-post"] };
const HOW: NavItem = { label: "How it works", href: "/how-it-works" };

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name?: string; avatar?: string | null } | null>(null);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [wraithOn, setWraithOn] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
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
      setSignedIn(true);
      // Wraith link: only for signed-in people, only while it is switched on, and not inside the phone apps (voice is not there yet)
      setWraithOn(document.body.dataset.wraith === 'on' && !isNativeApp());
      const u = data.session.user;
      supabase.from("profiles").select("full_name, avatar_url").eq("id", u.id).single()
        .then(({ data: p }) => {
          if (p) setUserProfile({ name: p.full_name, avatar: p.avatar_url });
        });
    });
  }, []);

  const signOut = async () => { try { await supabase.auth.signOut() } catch { /* already signed out */ } window.location.href = "/" };
  const isMobile = windowWidth < 900;
  const navHref = (n: NavItem) => (n.href === "/post-load" && !userProfile ? "/quick-post" : n.href);
  const isActive = (n: NavItem) => pathname === n.href || (n.also ?? []).includes(pathname) || (n.href === "/jobs" && pathname.startsWith("/jobs/"));
  const visibleItems = (g: NavGroup) => g.items.filter((i) => !(g.signedInOnly ?? []).includes(i.href) || signedIn);
  const groupActive = (g: NavGroup) => visibleItems(g).some((i) => i.href !== "/tools" ? (pathname === i.href || pathname.startsWith(i.href + "/")) : pathname === "/tools");
  const [menu, setMenu] = useState<string | null>(null);
  useEffect(() => { setMenu(null); setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest?.("[data-navmenu]")) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [menu]);

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
    top: "var(--safe-top, 0px)",
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
                {GROUPS.map((g) => (
                  <div key={g.label} data-navmenu style={{ position: "relative", display: "flex", alignItems: "center", height: 64 }}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={menu === g.label}
                      onClick={() => setMenu(menu === g.label ? null : g.label)}
                      style={groupActive(g) || menu === g.label ? { ...navLinkStyle, color: "#fff", borderBottom: "2px solid #ff6a13" } : navLinkStyle}
                    >
                      {g.label} <span aria-hidden style={{ fontSize: 10, marginLeft: 6, opacity: 0.7 }}>▾</span>
                    </button>
                    {menu === g.label && (
                      <div role="menu" style={{ position: "absolute", top: 60, left: 0, minWidth: 220, background: "rgba(10,12,16,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 6, boxShadow: "0 18px 50px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
                        {visibleItems(g).map((i) => (
                          <Link key={i.href} role="menuitem" href={i.href} onClick={() => setMenu(null)}
                            style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 14, color: pathname === i.href ? "#fff" : "#c9d0da", textDecoration: "none", padding: "10px 12px", borderRadius: 10, background: pathname === i.href ? "rgba(255,106,19,0.14)" : "none" }}>
                            {i.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <Link href={navHref(POST)} style={isActive(POST) ? { ...navLinkStyle, color: "#fff", borderBottom: "2px solid #ff6a13" } : navLinkStyle}>{POST.label}</Link>
                {wraithOn && (
                  <Link href="/wraith" style={navLinkStyle}>Wraith</Link>
                )}
                {!signedIn && (
                  <Link href={HOW.href} style={isActive(HOW) ? { ...navLinkStyle, color: "#fff", borderBottom: "2px solid #ff6a13" } : navLinkStyle}>{HOW.label}</Link>
                )}
              </div>
            )}

          {/* Desktop CTA */}
          <div style={ctaAreaStyle}>
            <HideInApp><a href="https://play.google.com/store/apps/details?id=pevo.oversizeescorthub.app" target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" style={{ display: "inline-flex", alignItems: "center" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/badges/google-play-badge.png" alt="Get it on Google Play" width={646} height={250} style={{ height: 46, width: "auto", display: "block", margin: "-6px -4px" }} /></a></HideInApp><HideInApp><a href="https://apps.apple.com/us/app/oversize-escort-hub/id6827319128" target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store" style={{ display: "inline-flex", alignItems: "center", marginLeft: 8 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/badges/app-store-badge.svg" alt="Download on the App Store" width={120} height={40} style={{ height: 40, width: "auto", display: "block" }} /></a></HideInApp>
        {userProfile ? (
          <><Link href="/dashboard" style={btnPrimeStyle}>Dashboard</Link><button type="button" onClick={signOut} style={btnGhostStyle}>Sign out</button></>
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
          {GROUPS.map((g) => (
            <div key={g.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7d8696", padding: "14px 24px 4px" }}>{g.label}</div>
              {visibleItems(g).map((i) => (
                <Link key={i.href} href={i.href} style={{ ...mobileLinkStyle, padding: "9px 24px" }} onClick={() => setOpen(false)}>{i.label}</Link>
              ))}
            </div>
          ))}
          <Link href={navHref(POST)} style={{ ...mobileLinkStyle, marginTop: 8, fontWeight: 700 }} onClick={() => setOpen(false)}>{POST.label}</Link>
          {wraithOn && (
            <Link href="/wraith" style={mobileLinkStyle} onClick={() => setOpen(false)}>Wraith</Link>
          )}
          {!signedIn && (
            <Link href={HOW.href} style={mobileLinkStyle} onClick={() => setOpen(false)}>{HOW.label}</Link>
          )}
          <div style={mobileCtaStyle}>
          {userProfile ? (
            <><Link href="/dashboard" style={{ ...btnPrimeStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Dashboard</Link>
            <button type="button" onClick={signOut} style={{ ...btnGhostStyle, textAlign: "center", padding: "10px 0" }}>Sign out</button>
            <Link href="/blocked" style={{ ...mobileLinkStyle, fontSize: 12, opacity: 0.7, textAlign: "center", padding: "8px 0" }} onClick={() => setOpen(false)}>Blocked users</Link><Link href="/delete-account" style={{ ...mobileLinkStyle, fontSize: 12, opacity: 0.7, textAlign: "center", padding: "8px 0" }} onClick={() => setOpen(false)}>Delete my account</Link></>
          ) : (
            <><Link href="/signin" style={{ ...btnGhostStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Sign in</Link><Link href="/signin?mode=signup" style={{ ...btnPrimeStyle, textAlign: "center", padding: "10px 0" }} onClick={() => setOpen(false)}>Get started</Link></>
          )}
          </div>
        </div>
      </header>
    </>
  );
}
