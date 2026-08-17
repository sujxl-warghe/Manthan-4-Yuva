"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Drive { id: string; name: string; planted: number; target: number; survival_rate: number; status: string }

export default function AdminDrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Drive[]>("/api/v1/drives").then(setDrives).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Operations</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Plantation Drives</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
            <tr><th className="px-5 py-3">Drive</th><th className="px-5 py-3">Planted / Target</th><th className="px-5 py-3">Survival</th><th className="px-5 py-3">Status</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-5 py-8 text-center text-charcoal/40">Loading…</td></tr>}
            {!loading && drives.map((d) => (
              <tr key={d.id} className="border-b border-forest-900/5">
                <td className="px-5 py-3 font-medium">{d.name}</td>
                <td className="px-5 py-3 text-charcoal/60">{d.planted} / {d.target}</td>
                <td className="px-5 py-3 text-forest-700">{d.survival_rate}%</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-forest-900/5 px-2.5 py-1 text-xs">{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
