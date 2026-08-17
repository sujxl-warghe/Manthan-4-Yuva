"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { api, Tree, PaginatedResponse, ApiError } from "@/lib/api";

export default function RegistryPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 15;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    api
      .getPaginated<Tree>(`/api/v1/trees?${params.toString()}`)
      .then((res) => {
        setTrees(res.data);
        setTotal(res.meta.total);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Registry</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950 sm:text-4xl">Tree Registry</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Search and filter every registered tree in the VrukshaSetu system.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-forest-900/15 bg-white px-4 py-2.5">
          <Search size={16} className="text-forest-700" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search Tree ID…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-charcoal/40"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-full border border-forest-900/15 bg-white px-4 py-2.5 text-sm outline-none"
        >
          <option value="">Status: All</option>
          <option value="HEALTHY">Healthy</option>
          <option value="AT_RISK">At Risk</option>
          <option value="VERIFICATION_DUE">Verification Due</option>
          <option value="DEAD">Dead</option>
          <option value="MISSING">Missing</option>
        </select>
        <span className="ml-auto text-sm text-charcoal/50">{total} trees found</span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-5 py-3.5 font-medium">Tree ID</th>
                <th className="px-5 py-3.5 font-medium">Species</th>
                <th className="px-5 py-3.5 font-medium">Category</th>
                <th className="px-5 py-3.5 font-medium">Ward</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Planted</th>
                <th className="px-5 py-3.5 font-medium">Last Verified</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-forest-900/5">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-forest-900/5" />
                    </td>
                  </tr>
                ))}
              {!loading && error && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && trees.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-charcoal/50">No trees match your search.</td></tr>
              )}
              {!loading && !error && trees.map((t) => (
                <tr key={t.id} className="border-b border-forest-900/5 transition-colors hover:bg-forest-900/[0.02]">
                  <td className="px-5 py-3.5">
                    <Link href={`/trees/${t.tree_code}`} className="font-mono text-xs font-medium text-forest-800 hover:underline">
                      {t.tree_code}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{t.species || "—"}</td>
                  <td className="px-5 py-3.5 text-charcoal/60">{t.category || "—"}</td>
                  <td className="px-5 py-3.5 text-charcoal/60">{t.ward || "—"}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-charcoal/60">{new Date(t.plantation_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-charcoal/60">
                    {t.last_verified_at ? new Date(t.last_verified_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-forest-900/10 px-5 py-3.5">
          <span className="text-xs text-charcoal/50">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-forest-900/15 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-forest-900/15 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
