"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface Report { id: string; tree_id: string | null; type: string; status: string; created_at: string }

const STATUSES = ["OPEN", "ASSIGNED", "IN_REVIEW", "RESOLVED", "ESCALATED"];
const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-stone/10 text-stone",
  ASSIGNED: "bg-amber/15 text-amber-800",
  IN_REVIEW: "bg-blue-500/10 text-blue-700",
  RESOLVED: "bg-forest-700/10 text-forest-800",
  ESCALATED: "bg-red/10 text-red-700",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get<Report[]>("/api/v1/admin/reports").then(setReports).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/api/v1/reports/${id}`, { status });
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      setToast(`Report updated to ${status}`);
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast(e instanceof ApiError ? e.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Community</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Community Reports</h1>
      <p className="mt-1 text-sm text-charcoal/50">Change a report&apos;s status — this actually updates the database.</p>

      {toast && (
        <div className="mt-4 rounded-lg bg-forest-900 px-4 py-2 text-sm text-cream">{toast}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
            <tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Tree</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Update</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-5 py-8 text-center text-charcoal/40">Loading…</td></tr>}
            {!loading && reports.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-charcoal/40">No reports yet.</td></tr>}
            {!loading && reports.map((r) => (
              <tr key={r.id} className="border-b border-forest-900/5">
                <td className="px-5 py-3 font-medium">{r.type.replace(/_/g, " ")}</td>
                <td className="px-5 py-3 font-mono text-xs text-charcoal/50">{r.tree_id ? r.tree_id.slice(0, 8) : "—"}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-5 py-3">
                  <select
                    disabled={updating === r.id}
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className="rounded-lg border border-forest-900/15 px-2.5 py-1.5 text-xs outline-none disabled:opacity-50"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
