import Image from "next/image";

export default function Header() {
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

          <nav className="hidden md:flex items-center gap-3">
            <a className="text-sm text-white/80 hover:text-white" href="#boards">Boards</a>
            <a className="text-sm text-white/80 hover:text-white" href="#how">How it works</a>
            <a className="text-sm text-white/80 hover:text-white" href="#tiers">Membership</a>
            <a className="text-sm text-white/80 hover:text-white" href="#verify">Verification</a>
            <a className="text-sm text-white/80 hover:text-white" href="#contact">Support</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="btn btn-ghost">Sign in</button>
            <button className="btn btn-prime">Post a Load</button>
          </div>
        </div>
      </div>
    </header>
  );
}
