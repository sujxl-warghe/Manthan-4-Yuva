"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { api } from "@/lib/api";

interface Replacement { id: string; original_tree_id: string; status: string }

export default function ReplacementPage() {
  const [items, setItems] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Replacement[]>("/api/v1/admin/replacements").then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Chain of Custody</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Replacement Tracking</h1>
      <p className="mt-1 max-w-xl text-sm text-charcoal/50">
        When a tree fails, its replacement inherits a fresh survival timeline — e.g.{" "}
        <span className="font-mono">NGP-2026-000421</span> →{" "}
        <span className="font-mono">NGP-2026-000421-R1</span>.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
            <tr><th className="px-5 py-3">Original Tree</th><th className="px-5 py-3">Flow</th><th className="px-5 py-3">Status</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="px-5 py-8 text-center text-charcoal/40">Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-charcoal/40">No replacements recorded yet.</td></tr>}
            {!loading && items.map((r) => (
              <tr key={r.id} className="border-b border-forest-900/5">
                <td className="px-5 py-3 font-mono text-xs text-charcoal/60">{r.original_tree_id.slice(0, 8)}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2 text-xs text-charcoal/60">
                    Failed <ArrowDown size={12} className="rotate-[-90deg]" /> Replacement Planted
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-forest-700/10 px-2.5 py-1 text-xs font-medium text-forest-800">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
