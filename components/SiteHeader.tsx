"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const emailDisplay = user?.email
    ? user.email.length > 22
      ? user.email.slice(0, 10) + "…" + user.email.slice(user.email.lastIndexOf("@"))
      : user.email
    : null;

  return (
    <header className="w-full">
      {/* 🔥 Hype ticker */}
      <div className="bg-black/60 border-b border-white/10 overflow-hidden">
        <div className="animate-marquee px-6 py-2 text-sm text-[var(--oeh-cyan)]">
          🔥 Load #4821 awarded • 312 mi • Pay: 7 days • Pro window active • 💰 FastPay used • Escort paid in 24 hrs • 🚛 New load posted • TX → LA • Bidding live
        </div>
      </div>

      {/* Main header */}
      <div className="glass border-b border-white/10">
        <div
          className="mx-auto max-w-6xl py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ padding: "16px clamp(12px, 4vw, 48px)" }}
        >
          {/* Logo + brand */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="relative rounded-2xl bg-black/30 ring-1 ring-white/15 overflow-hidden flex-shrink-0"
              style={{ width: "clamp(40px, 6vw, 56px)", height: "clamp(40px, 6vw, 56px)" }}>
              <Image
                src="/logo.png"
                alt="Oversize Escort Hub"
                fill
                className="object-contain p-2"
                priority
              />
            </div>

            <div className="leading-tight">
              <div className="font-extrabold tracking-wide" style={{ fontSize: "clamp(14px, 3vw, 22px)" }}>
                <span className="brand-neon">OVERSIZE</span>{" "}
                <span className="text-white">ESCORT HUB</span>
              </div>
              <div className="text-[var(--oeh-muted)] hidden sm:block" style={{ fontSize: "clamp(10px, 1.5vw, 12px)" }}>
                Marketplace • Ranked Bidding • Certification &amp; Insurance Verification
              </div>
            </div>
          </Link>

          {/* Nav — scrollable on small screens */}
          <nav
            className="flex items-center gap-1 overflow-x-auto"
            style={{ maxWidth: "100%", scrollbarWidth: "none" }}
          >
            <Link className="text-sm text-white/80 hover:text-white whitespace-nowrap px-2 py-1" href="/loads">Boards</Link>
            <Link className="text-sm text-white/80 hover:text-white whitespace-nowrap px-2 py-1" href="/#how">How it works</Link>
            <Link className="text-sm text-white/80 hover:text-white whitespace-nowrap px-2 py-1" href="/pricing">Membership</Link>
            <Link className="text-sm text-white/80 hover:text-white whitespace-nowrap px-2 py-1" href="/verify">Verification</Link>
            <a className="text-sm text-white/80 hover:text-white whitespace-nowrap px-2 py-1" href="mailto:support@oversize-escort-hub.com">Support</a>
          </nav>

          {/* Auth buttons */}
          {!loading && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {user ? (
                <>
                  <span
                    className="text-white/60 hidden sm:block"
                    style={{ fontFamily: "monospace", fontSize: "clamp(9px, 1.2vw, 11px)" }}
                  >
                    {emailDisplay}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: "clamp(10px, 1.5vw, 13px)", padding: "6px 12px" }}
                    onClick={() => router.push("/dashboard")}
                  >
                    Dashboard
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: "clamp(10px, 1.5vw, 13px)", padding: "6px 12px", color: "var(--oeh-red, #ff3535)" }}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: "clamp(10px, 1.5vw, 13px)", padding: "6px 12px" }}
                    onClick={() => router.push("/signin")}
                  >
                    Sign in
                  </button>
                  <button
                    className="btn btn-prime"
                    style={{ fontSize: "clamp(10px, 1.5vw, 13px)", padding: "6px 12px" }}
                    onClick={() => router.push("/post-load")}
                  >
                    Post a Load
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
