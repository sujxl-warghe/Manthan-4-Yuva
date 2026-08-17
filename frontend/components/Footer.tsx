import Link from "next/link";
import { Leaf, Smartphone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-forest-900/10 bg-forest-950 text-cream/80">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-5 rounded-2xl border border-cream/10 bg-white/[0.03] px-6 py-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-lg font-medium text-cream">
              Get VrukshaSetu on your phone.
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-forest-500">
              Plant. Protect. Prove Survival.
            </p>
          </div>
          <a
            href="/#get-the-app"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-forest-950 transition-transform hover:scale-[1.03]"
          >
            <Smartphone size={16} />
            Download the App
          </a>
        </div>

        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500/20">
                <Leaf size={16} className="text-forest-500" />
              </span>
              <span className="font-display text-lg font-semibold text-cream">VrukshaSetu</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">
              Plant. Protect. Prove Survival. A civic-tech platform tracking real tree survival
              across Nagpur, Maharashtra.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-cream">Platform</h4>
            <ul className="space-y-2 text-sm text-cream/60">
              <li><Link href="/green-map" className="hover:text-forest-500">Green Map</Link></li>
              <li><Link href="/registry" className="hover:text-forest-500">Tree Registry</Link></li>
              <li><Link href="/impact" className="hover:text-forest-500">Impact Dashboard</Link></li>
              <li><Link href="/drives" className="hover:text-forest-500">Plantation Drives</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-cream">Community</h4>
            <ul className="space-y-2 text-sm text-cream/60">
              <li><Link href="/leaderboard" className="hover:text-forest-500">Leaderboard</Link></li>
              <li><Link href="/about" className="hover:text-forest-500">About the Mission</Link></li>
              <li><Link href="/admin" className="hover:text-forest-500">Admin Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-cream">Nagpur Green Mission</h4>
            <p className="text-sm text-cream/60">
              A prototype built for the hackathon — demonstrating what accountable,
              survival-first urban forestry could look like for Nagpur.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-cream/10 pt-6 text-xs text-cream/40">
          © {new Date().getFullYear()} VrukshaSetu — Hackathon Prototype. Don&apos;t count trees. Count survivors.
        </div>
      </div>
    </footer>
  );
}
