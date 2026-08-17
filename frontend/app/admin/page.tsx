"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TreePine, TrendingUp, AlertTriangle, ClipboardCheck, Flag, ShieldAlert, RefreshCw,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import { api, ApiError } from "@/lib/api";

interface Dashboard {
  total_trees: number; survival_rate: number; at_risk: number; verification_due: number;
  open_reports: number; escalations: number; replacement_pending: number;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Dashboard>("/api/v1/admin/dashboard").catch((e: ApiError) => {
      setError(e.message);
      return null;
    }).then((d) => d && setData(d));
  }, []);

  const cards = data
    ? [
        { label: "Total Trees", value: data.total_trees, icon: TreePine },
        { label: "Survival Rate", value: data.survival_rate, suffix: "%", decimals: 1, icon: TrendingUp },
        { label: "At Risk", value: data.at_risk, icon: AlertTriangle },
        { label: "Verification Due", value: data.verification_due, icon: ClipboardCheck },
        { label: "Open Reports", value: data.open_reports, icon: Flag },
        { label: "Escalations", value: data.escalations, icon: ShieldAlert },
        { label: "Replacement Pending", value: data.replacement_pending, icon: RefreshCw },
      ]
    : [];

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Command Center</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Overview</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {!data && !error && Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-forest-900/5" />
        ))}
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-2xl border border-forest-900/10 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-forest-900/5 text-forest-700">
                <Icon size={16} />
              </div>
              <div className="font-display text-2xl font-medium text-forest-950">
                <AnimatedCounter value={c.value} suffix={c.suffix} decimals={c.decimals} />
              </div>
              <div className="mt-1 text-xs text-charcoal/50">{c.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-forest-900/10 bg-white p-6 text-sm text-charcoal/60">
        Use the sidebar to manage the Tree Registry, review Verification queues, resolve community
        Reports, track the Accountability chain, process Replacements, run Audits, manage Plantation
        Drives and Institutions, or dive into full Analytics.
      </div>
    </div>
  );
}
