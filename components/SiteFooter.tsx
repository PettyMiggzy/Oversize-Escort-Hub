import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-5 text-sm text-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

        {/* Flags — left side */}
        <div className="flex items-center gap-3">
          {/* American Flag */}
          <span title="United States" style={{ fontSize: '1.6rem', lineHeight: 1 }}>&#x1F1FA;&#x1F1F8;</span>

          {/* Thin Blue Line Flag SVG */}
          <svg
            title="Thin Blue Line"
            width="40"
            height="24"
            viewBox="0 0 40 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'inline-block', borderRadius: '2px', overflow: 'hidden' }}
          >
            {/* Top black stripe */}
            <rect x="0" y="0" width="40" height="10" fill="#111111" />
            {/* Thin blue line */}
            <rect x="0" y="10" width="40" height="4" fill="#1a6fc4" />
            {/* Bottom black stripe */}
            <rect x="0" y="14" width="40" height="10" fill="#111111" />
          </svg>

          {/* Canadian Flag */}
          <span title="Canada" style={{ fontSize: '1.6rem', lineHeight: 1 }}>&#x1F1E8;&#x1F1E6;</span>
        </div>

        {/* Copyright */}
        <span>&copy; {new Date().getFullYear()} Oversize Escort Hub</span>

        {/* Links */}
        <div className="flex gap-4">
          <Link className="hover:text-white" href="/terms">Terms</Link>
          <Link className="hover:text-white" href="/privacy">Privacy</Link>
          <Link className="hover:text-white" href="/conduct">Code of Conduct</Link>
        </div>
      </div>
    </footer>
  );
}
