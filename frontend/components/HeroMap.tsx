"use client";

import dynamic from "next/dynamic";

const HeroMapInner = dynamic(() => import("./HeroMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-forest-900/10 bg-white/40">
      <span className="font-mono text-xs text-forest-700">Loading Nagpur Green Map…</span>
    </div>
  ),
});

export default function HeroMap() {
  return (
    <div className="overflow-hidden rounded-3xl border border-forest-900/10 shadow-2xl shadow-forest-900/10">
      <HeroMapInner />
    </div>
  );
}
