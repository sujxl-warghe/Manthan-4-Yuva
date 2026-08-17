"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface Audit { id: string; tree_id: string; result: string }

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api.get<Audit[]>("/api/v1/admin/audits").then(setAudits).finally(() => setLoading(false));
  }, []);

  const runDemoAudit = async () => {
    try {
      const trees = await api.getPaginated<{ id: string }>("/api/v1/trees?page=1&page_size=1");
      const tid = trees.data[0]?.id;
      if (!tid) return;
      const res = await api.post<{ id: string; result: string }>("/api/v1/audits", {
        tree_id: tid, expected_status: "HEALTHY", actual_status: "HEALTHY", notes: "Demo audit run from admin panel",
      });
      setAudits((a) => [{ id: res.id, tree_id: tid, result: res.result }, ...a]);
      setToast("Demo audit recorded");
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast(e instanceof ApiError ? e.message : "Audit failed");
    }
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Field Verification</span>
          <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Audit Center</h1>
        </div>
        <button
          onClick={runDemoAudit}
          className="rounded-full bg-forest-900 px-5 py-2.5 text-sm font-medium text-cream hover:opacity-90"
        >
          Run Demo Audit
        </button>
      </div>

      {toast && <div className="mt-4 rounded-lg bg-forest-900 px-4 py-2 text-sm text-cream">{toast}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
            <tr><th className="px-5 py-3">Audit</th><th className="px-5 py-3">Tree</th><th className="px-5 py-3">Result</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="px-5 py-8 text-center text-charcoal/40">Loading…</td></tr>}
            {!loading && audits.map((a) => (
              <tr key={a.id} className="border-b border-forest-900/5">
                <td className="px-5 py-3 font-mono text-xs">{a.id.slice(0, 8)}</td>
                <td className="px-5 py-3 font-mono text-xs text-charcoal/60">{a.tree_id.slice(0, 8)}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${a.result === "MATCH" ? "bg-forest-700/10 text-forest-800" : "bg-red/10 text-red-700"}`}>
                    {a.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
