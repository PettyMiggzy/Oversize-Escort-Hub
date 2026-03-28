"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

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
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4" style={{ textDecoration: "none", color: "inherit" }}>
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
                Marketplace • Ranked Bidding • Certification &amp; Insurance Verification
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-3">
            <Link className="text-sm text-white/80 hover:text-white" href="/loads">Boards</Link>
            <Link className="text-sm text-white/80 hover:text-white" href="/#how">How it works</Link>
            <Link className="text-sm text-white/80 hover:text-white" href="/pricing">Membership</Link>
            <Link className="text-sm text-white/80 hover:text-white" href="/verify">Verification</Link>
            <a className="text-sm text-white/80 hover:text-white" href="mailto:support@oversize-escort-hub.com">Support</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => router.push("/signin")}>Sign in</button>
            <button className="btn btn-prime" onClick={() => router.push("/post-load")}>Post a Load</button>
          </div>
        </div>
      </div>
    </header>
  );
}
