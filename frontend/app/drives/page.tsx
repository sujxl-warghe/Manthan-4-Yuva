"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, TreePine } from "lucide-react";
import { api } from "@/lib/api";

interface Drive {
  id: string; name: string; description: string | null; target: number;
  planted: number; surviving: number; survival_rate: number; status: string;
}

export default function DrivesPage() {
  const [drives, setDrives] = useState<Drive[] | null>(null);

  useEffect(() => {
    api.get<Drive[]>("/api/v1/drives").then(setDrives);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Community</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950 sm:text-4xl">Green Drives</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Plantation drives across Nagpur — tracked by how many trees actually survive, not just how many were planted.
      </p>

      {!drives && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-forest-900/5" />)}
        </div>
      )}

      {drives && drives.length === 0 && (
        <div className="mt-16 text-center text-charcoal/50">No plantation drives yet.</div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {drives?.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-medium text-forest-950">{d.name}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${d.status === "ACTIVE" ? "bg-forest-700/10 text-forest-800" : "bg-stone/10 text-stone"}`}>
                {d.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-charcoal/60 line-clamp-2">{d.description}</p>

            <div className="mt-4 flex items-center gap-4 text-xs text-charcoal/50">
              <span className="flex items-center gap-1"><Target size={12} /> Target {d.target}</span>
              <span className="flex items-center gap-1"><TreePine size={12} /> Planted {d.planted}</span>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-charcoal/50">
                <span>Progress toward target</span>
                <span>{d.target ? Math.min(100, Math.round((d.planted / d.target) * 100)) : 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-forest-900/5">
                <motion.div
                  className="h-full rounded-full bg-forest-900"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${d.target ? Math.min(100, (d.planted / d.target) * 100) : 0}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-charcoal/50">Surviving: <strong className="text-forest-800">{d.surviving}</strong></span>
              <span className="font-medium text-forest-700">{d.survival_rate}% survival</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
