"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "@/lib/api";

interface WardStat { ward: string; total: number; survival_rate: number }
interface VerificationAnalytics { total: number; by_status: Record<string, number> }

export default function AdminAnalyticsPage() {
  const [wards, setWards] = useState<WardStat[]>([]);
  const [verification, setVerification] = useState<VerificationAnalytics | null>(null);

  useEffect(() => {
    api.get<WardStat[]>("/api/v1/analytics/wards").then(setWards);
    api.get<VerificationAnalytics>("/api/v1/analytics/verification").then(setVerification);
  }, []);

  return (
    <div className="p-6 md:p-10">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Analytics</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950">Full Analytics</h1>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-forest-900/10 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-charcoal/70">Ward Survival Rate</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={wards}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e1d3" />
              <XAxis dataKey="ward" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="survival_rate" fill="#1f7a45" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-forest-900/10 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-charcoal/70">Verification Compliance</h3>
          {verification && (
            <div className="space-y-3">
              {Object.entries(verification.by_status).map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-xs text-charcoal/60">
                    <span>{status}</span><span>{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-forest-900/5">
                    <div
                      className="h-full rounded-full bg-forest-700"
                      style={{ width: `${verification.total ? (count / verification.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
