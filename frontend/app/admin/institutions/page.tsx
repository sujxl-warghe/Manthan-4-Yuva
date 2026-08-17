"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Institution { id: string; name: string; type: string }

export default function InstitutionsPage() {
  const [items, setItems] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Institution[]>("/api/v1/institutions").then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Partners</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Institutions</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-forest-900/5" />)}
        {!loading && items.map((i) => (
          <div key={i.id} className="rounded-xl border border-forest-900/10 bg-white p-4">
            <div className="font-medium text-charcoal/90">{i.name}</div>
            <span className="mt-1 inline-block rounded-full bg-forest-900/5 px-2.5 py-0.5 text-xs text-charcoal/60">{i.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
