"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { api } from "@/lib/api";

interface Escalation { id: string; status: string; priority: string; level: string }
interface Dashboard { open_reports: number; escalations: number; verification_due: number; at_risk: number; replacement_pending: number }

const CHAIN = ["Guardian", "Supervisor", "Institution / NGO", "Authority"];

export default function AccountabilityPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [dash, setDash] = useState<Dashboard | null>(null);

  useEffect(() => {
    api.get<Escalation[]>("/api/v1/admin/escalations").then(setEscalations);
    api.get<Dashboard>("/api/v1/admin/dashboard").then(setDash);
  }, []);

  const resolved = escalations.filter((e) => e.status === "RESOLVED").length;
  const open = escalations.filter((e) => e.status === "OPEN").length;

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Accountability</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Accountability Center</h1>

      <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-forest-900/10 bg-white p-8">
        {CHAIN.map((level, i) => (
          <div key={level} className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-full border border-forest-900/15 bg-forest-900/[0.03] px-6 py-2.5 text-sm font-medium text-forest-900"
            >
              {level}
            </motion.div>
            {i < CHAIN.length - 1 && <ArrowDown size={16} className="my-2 text-forest-700/40" />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatBox label="Open Issues" value={open} />
        <StatBox label="Overdue Verification" value={dash?.verification_due ?? 0} />
        <StatBox label="At Risk" value={dash?.at_risk ?? 0} />
        <StatBox label="Escalations" value={dash?.escalations ?? 0} />
        <StatBox label="Resolved" value={resolved} />
        <StatBox label="Replacement Pending" value={dash?.replacement_pending ?? 0} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-forest-900/10 bg-white p-5">
      <div className="font-display text-2xl font-medium text-forest-950">{value}</div>
      <div className="mt-1 text-xs text-charcoal/50">{label}</div>
    </div>
  );
}
