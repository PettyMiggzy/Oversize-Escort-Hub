import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-6 py-5 text-sm text-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Oversize Escort Hub</span>
        <div className="flex gap-4">
          <Link className="hover:text-white" href="/terms">Terms</Link>
          <Link className="hover:text-white" href="/privacy">Privacy</Link>
          <Link className="hover:text-white" href="/conduct">Code of Conduct</Link>
        </div>
      </div>
    </footer>
  );
}
