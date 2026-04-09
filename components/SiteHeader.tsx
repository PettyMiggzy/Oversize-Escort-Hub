"use client";
import { useState } from "react";
import Link from "next/link";

const NAV = [
  { label: "Flat Rate",    href: "/loads" },
  { label: "Open Loads",   href: "/loads" },
  { label: "Bid Board",    href: "/bid-board" },
  { label: "Find Escorts", href: "/find-escorts" },
  { label: "Post a Load",  href: "/post-load" },
  { label: "Pricing",      href: "/pricing" },
  { label: "Verification", href: "/verify" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-white font-bold text-lg tracking-tight shrink-0">
          OEH
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/signin" className="btn btn-ghost text-sm">Sign in</Link>
          <Link href="/dashboard" className="btn btn-prime text-sm">Dashboard</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white text-2xl leading-none p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-base text-white/80 hover:text-white py-2"
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <Link href="/signin" className="btn btn-ghost w-full min-h-[48px] text-center" onClick={() => setOpen(false)}>Sign in</Link>
            <Link href="/dashboard" className="btn btn-prime w-full min-h-[48px] text-center" onClick={() => setOpen(false)}>Dashboard</Link>
          </div>
        </div>
      )}
    </header>
  );
}
