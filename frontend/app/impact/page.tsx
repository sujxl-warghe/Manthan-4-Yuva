"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import AnimatedCounter from "@/components/AnimatedCounter";
import { api } from "@/lib/api";

interface GreenScore {
  green_score: number; survival_rate: number; verification_rate: number;
  components: { survival: number; verification: number; maintenance: number; participation: number; replacement_success: number };
}
interface SurvivalPoint { month: string; planted: number; surviving: number; survival_rate: number }
interface WardStat { ward: string; total: number; survival_rate: number }
interface SpeciesStat { species: string; total: number; survival_rate: number }
interface CategoryStat { category: string; total: number }
interface WardFull { id: string; name: string; trees: number; alive: number; at_risk: number; dead: number; survival_rate: number; verification_rate: number }

const COLORS = ["#0b3d2e", "#1f7a45", "#4f9d69", "#8fbf9f", "#d89b2b", "#c94c4c", "#66736b"];

export default function ImpactPage() {
  const [score, setScore] = useState<GreenScore | null>(null);
  const [survival, setSurvival] = useState<SurvivalPoint[]>([]);
  const [wardAnalytics, setWardAnalytics] = useState<WardStat[]>([]);
  const [species, setSpecies] = useState<SpeciesStat[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [wards, setWards] = useState<WardFull[]>([]);

  useEffect(() => {
    api.get<GreenScore>("/api/v1/green-score").then(setScore);
    api.get<SurvivalPoint[]>("/api/v1/analytics/survival").then(setSurvival);
    api.get<WardStat[]>("/api/v1/analytics/wards").then(setWardAnalytics);
    api.get<SpeciesStat[]>("/api/v1/analytics/species").then(setSpecies);
    api.get<CategoryStat[]>("/api/v1/analytics/categories").then(setCategories);
    api.get<WardFull[]>("/api/v1/wards").then((d) => setWards(d.sort((a, b) => b.survival_rate - a.survival_rate)));
  }, []);

  const topWard = wards[0];
  const atRiskWard = [...wards].sort((a, b) => b.at_risk - a.at_risk)[0];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Impact</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950 sm:text-4xl">Survival Analytics</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Every number below is calculated live from the VrukshaSetu database.
      </p>

      {/* Green Score */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-forest-900/10 bg-forest-950 p-8 text-cream">
          <span className="font-mono text-xs uppercase tracking-widest text-forest-500">Nagpur Green Score</span>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-display text-6xl font-medium">
              {score ? <AnimatedCounter value={score.green_score} decimals={1} /> : "—"}
            </span>
            <span className="mb-2 text-lg text-cream/50">/ 100</span>
          </div>
          <ScoreRing value={score?.green_score ?? 0} />
          <div className="mt-6 space-y-2.5">
            {score && Object.entries(score.components).map(([k, v]) => (
              <MetricBar key={k} label={k.replace(/_/g, " ")} value={v} />
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ChartCard title="Plantation & Survival Trend">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={survival}>
                <defs>
                  <linearGradient id="surv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f7a45" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1f7a45" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e1d3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="planted" stroke="#0b3d2e" fill="none" strokeWidth={1.5} />
                <Area type="monotone" dataKey="surviving" stroke="#1f7a45" fill="url(#surv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Category Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="category" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ward Comparison (Survival %)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={wardAnalytics.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e1d3" />
                <XAxis dataKey="ward" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="survival_rate" fill="#1f7a45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Species Survival Rate">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={species.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e1d3" />
                <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="species" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="survival_rate" fill="#4f9d69" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Ward performance table */}
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-medium text-forest-950">Ward-wise Tree Performance</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {topWard && <Pill label="Top Performing" value={topWard.name} tone="good" />}
            {atRiskWard && atRiskWard.at_risk > 0 && <Pill label="Most At Risk" value={atRiskWard.name} tone="bad" />}
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-forest-900/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-forest-900/10 bg-forest-900/[0.03] text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-5 py-3.5">Ward</th>
                <th className="px-5 py-3.5">Trees</th>
                <th className="px-5 py-3.5">Alive</th>
                <th className="px-5 py-3.5">At Risk</th>
                <th className="px-5 py-3.5">Dead</th>
                <th className="px-5 py-3.5">Survival %</th>
                <th className="px-5 py-3.5">Verification %</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => (
                <tr key={w.id} className="border-b border-forest-900/5 hover:bg-forest-900/[0.02]">
                  <td className="px-5 py-3.5 font-medium">{w.name}</td>
                  <td className="px-5 py-3.5">{w.trees}</td>
                  <td className="px-5 py-3.5 text-forest-700">{w.alive}</td>
                  <td className="px-5 py-3.5 text-amber-700">{w.at_risk}</td>
                  <td className="px-5 py-3.5 text-red-600">{w.dead}</td>
                  <td className="px-5 py-3.5 font-medium">{w.survival_rate}%</td>
                  <td className="px-5 py-3.5">{w.verification_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="mt-2">
      <circle cx="50" cy="50" r={r} stroke="#ffffff22" strokeWidth="8" fill="none" />
      <motion.circle
        cx="50" cy="50" r={r} stroke="#4f9d69" strokeWidth="8" fill="none" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (value / 100) * c }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-cream/60">
        <span className="capitalize">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-forest-500"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-forest-900/10 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-charcoal/70">{title}</h3>
      {children}
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  return (
    <span className={`rounded-full px-3 py-1.5 font-medium ${tone === "good" ? "bg-forest-700/10 text-forest-800" : "bg-red/10 text-red-700"}`}>
      {label}: {value}
    </span>
  );
}
