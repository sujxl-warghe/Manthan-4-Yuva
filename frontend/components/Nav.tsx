"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Leaf, Smartphone } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/green-map", label: "Green Map" },
  { href: "/registry", label: "Tree Registry" },
  { href: "/impact", label: "Impact" },
  { href: "/drives", label: "Drives" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
];
export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-forest-900/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-cream">
            <Leaf size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-forest-950">
            VrukshaSetu
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-forest-700 ${
                pathname === l.href ? "text-forest-900" : "text-charcoal/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/#get-the-app"
            className="inline-flex items-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-900"
          >
            <Smartphone size={14} />
            Get the App
          </a>
          <Link
            href="/admin"
            className="rounded-full border border-forest-900/20 px-4 py-2 text-sm font-medium text-forest-900 transition-colors hover:bg-forest-900 hover:text-cream"
          >
            Admin Portal
          </Link>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-forest-900/10 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-forest-900/5"
                >
                  {l.label}
                </Link>
              ))}
              <a
                href="/#get-the-app"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-forest-700 px-3 py-2.5 text-sm font-medium text-cream"
              >
                <Smartphone size={14} />
                Get the App
              </a>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-forest-900 px-3 py-2.5 text-center text-sm font-medium text-cream"
              >
                Admin Portal
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
