"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, TreePine, ScanLine, Flag, ShieldAlert, RefreshCw,
  ClipboardCheck, Sprout, Building2, BarChart3, LogOut, Leaf,
} from "lucide-react";

const SECTIONS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/trees", label: "Tree Registry", icon: TreePine },
  { href: "/admin/verification", label: "Verification", icon: ScanLine },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/accountability", label: "Accountability", icon: ShieldAlert },
  { href: "/admin/replacement", label: "Replacement", icon: RefreshCw },
  { href: "/admin/audits", label: "Audits", icon: ClipboardCheck },
  { href: "/admin/drives", label: "Plantation Drives", icon: Sprout },
  { href: "/admin/institutions", label: "Institutions", icon: Building2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vs_token");
    if (!token && pathname !== "/login") {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem("vs_token");
    router.push("/login");
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-64 flex-col border-r border-forest-900/10 bg-forest-950 text-cream lg:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500/20">
            <Leaf size={16} className="text-forest-500" />
          </span>
          <span className="font-display text-lg font-semibold">VrukshaSetu</span>
        </div>
        <span className="px-6 pb-3 font-mono text-[10px] uppercase tracking-widest text-cream/40">
          Authority Command Center
        </span>
        <nav className="flex-1 space-y-1 px-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = pathname === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-forest-500/15 text-cream" : "text-cream/60 hover:bg-white/5 hover:text-cream"
                }`}
              >
                <Icon size={16} />
                {s.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/" className="mb-1 block rounded-lg px-3 py-2.5 text-sm text-cream/60 hover:bg-white/5">
            ← Back to Public Site
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cream/60 hover:bg-white/5"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
