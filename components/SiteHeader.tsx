"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full">
      {/* 🔥 Hype ticker */}
      <div className="bg-black/60 border-b border-white/10 overflow-hidden">
        <div className="animate-marquee px-6 py-2 text-sm text-[var(--oeh-cyan)]">
          🔥 Load #4821 awarded • 312 mi • Pay: 7 days • Pro window active • 🚀 FastPay used • Escort paid in 24 hrs • 📦 New load posted • TX → LA • Bidding live
        </div>
      </div>

      {/* Main header */}
      <div className="glass border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-black/30 ring-1 ring-white/15 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Oversize Escort Hub"
                fill
                className="object-contain p-2"
                priority
              />
            </div>

            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-wide">
                <span className="brand-neon">OVERSIZE</span>{" "}
                <span className="text-white">ESCORT HUB</span>
              </div>
              <div className="text-sm text-[var(--oeh-muted)]">
                Marketplace • Ranked Bidding • Certification & Insurance Verification
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3">
            <a className="text-sm text-white/80 hover:text-white" href="#boards">Boards</a>
            <a className="text-sm text-white/80 hover:text-white" href="#how">How it works</a>
            <a className="text-sm text-white/80 hover:text-white" href="#tiers">Membership</a>
            <a className="text-sm text-white/80 hover:text-white" href="#verify">Verification</a>
            <a className="text-sm text-white/80 hover:text-white" href="#contact">Support</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button className="btn btn-ghost">Sign in</button>
            <button className="btn btn-prime">Post a Load</button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-12 h-12 text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile dropdown overlay */}
        {menuOpen && (
          <div className="md:hidden bg-black/95 border-t border-white/10 px-4 py-6 flex flex-col gap-4">
            <a className="text-base text-white/80 hover:text-white py-2" href="#boards" onClick={() => setMenuOpen(false)}>Boards</a>
            <a className="text-base text-white/80 hover:text-white py-2" href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a className="text-base text-white/80 hover:text-white py-2" href="#tiers" onClick={() => setMenuOpen(false)}>Membership</a>
            <a className="text-base text-white/80 hover:text-white py-2" href="#verify" onClick={() => setMenuOpen(false)}>Verification</a>
            <a className="text-base text-white/80 hover:text-white py-2" href="#contact" onClick={() => setMenuOpen(false)}>Support</a>
            <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <button className="btn btn-ghost w-full min-h-[48px]">Sign in</button>
              <button className="btn btn-prime w-full min-h-[48px]">Post a Load</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
