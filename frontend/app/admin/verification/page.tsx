"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScanLine, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface Verification { id: string; tree_id: string; status: string; created_at: string }

export default function AdminVerificationPage() {
  const [items, setItems] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Verification[]>("/api/v1/admin/verifications").then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">AI-Assisted</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Verification Queue</h1>
      <p className="mt-1 max-w-xl text-sm text-charcoal/50">
        Tree detection, GPS match, photo similarity and duplicate checks — DEMO MODE, clearly labeled below.
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 flex items-center gap-4 rounded-2xl border border-forest-900/10 bg-forest-950 p-6 text-cream"
      >
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-forest-500/20">
          <ScanLine size={22} className="text-forest-500" />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-forest-500/50"
            animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-forest-500">AI-Assisted Verification</div>
          <div className="text-sm text-cream/70">Demo mode — no external AI provider connected in this prototype.</div>
        </div>
      </motion.div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
            <tr><th className="px-5 py-3">Verification</th><th className="px-5 py-3">Tree</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Date</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-5 py-8 text-center text-charcoal/40">Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-charcoal/40">No verifications yet.</td></tr>}
            {!loading && items.map((v) => (
              <tr key={v.id} className="border-b border-forest-900/5">
                <td className="px-5 py-3 font-mono text-xs">{v.id.slice(0, 8)}</td>
                <td className="px-5 py-3 font-mono text-xs text-charcoal/60">{v.tree_id.slice(0, 8)}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-forest-700">
                    <CheckCircle2 size={14} /> {v.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-charcoal/50">{new Date(v.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
