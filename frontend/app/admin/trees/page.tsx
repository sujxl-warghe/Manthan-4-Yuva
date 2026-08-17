"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { api, Tree } from "@/lib/api";

export default function AdminTreesPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPaginated<Tree>("/api/v1/trees?page=1&page_size=25").then((r) => {
      setTrees(r.data);
      setTotal(r.meta.total);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Registry</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Tree Registry</h1>
      <p className="mt-1 text-sm text-charcoal/50">{total} total trees.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
            <tr>
              <th className="px-5 py-3">Tree ID</th><th className="px-5 py-3">Species</th>
              <th className="px-5 py-3">Ward</th><th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Risk</th><th className="px-5 py-3">Planted</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-5 py-8 text-center text-charcoal/40">Loading…</td></tr>}
            {!loading && trees.map((t) => (
              <tr key={t.id} className="border-b border-forest-900/5 hover:bg-forest-900/[0.02]">
                <td className="px-5 py-3">
                  <Link href={`/trees/${t.tree_code}`} target="_blank" className="font-mono text-xs text-forest-800 hover:underline">
                    {t.tree_code}
                  </Link>
                </td>
                <td className="px-5 py-3">{t.species}</td>
                <td className="px-5 py-3 text-charcoal/60">{t.ward}</td>
                <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3 text-charcoal/60">{t.risk_level}</td>
                <td className="px-5 py-3 text-charcoal/60">{new Date(t.plantation_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
