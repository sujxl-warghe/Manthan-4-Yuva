"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { api } from "@/lib/api";

interface Citizen { rank: number; name: string; points: number; trees_planted: number; trees_surviving: number }
interface College { rank: number; college: string; trees: number; survival_rate: number }
interface WardRank { rank: number; ward: string; trees: number; survival_rate: number }

type Tab = "citizens" | "colleges" | "wards";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("citizens");
  const [citizens, setCitizens] = useState<Citizen[] | null>(null);
  const [colleges, setColleges] = useState<College[] | null>(null);
  const [wardRank, setWardRank] = useState<WardRank[] | null>(null);

  useEffect(() => {
    api.get<Citizen[]>("/api/v1/leaderboard/citizens?limit=20").then(setCitizens);
    api.get<College[]>("/api/v1/leaderboard/colleges").then(setColleges);
    api.get<WardRank[]>("/api/v1/leaderboard/wards").then(setWardRank);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Recognition</span>
      <h1 className="mt-1 font-display text-3xl font-medium text-forest-950 sm:text-4xl">Green Leaderboards</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Ranked by survival — not plantation count. Real care, recognized.
      </p>

      <div className="mt-6 inline-flex rounded-full border border-forest-900/10 bg-white p-1">
        {(["citizens", "colleges", "wards"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-forest-900 text-cream" : "text-charcoal/60 hover:text-forest-800"
            }`}
          >
            {t === "citizens" ? "Citizens" : t === "colleges" ? "College Green League" : "Wards"}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm">
        {tab === "citizens" && (
          <List
            loading={!citizens}
            items={citizens?.map((c) => ({
              rank: c.rank,
              primary: c.name,
              secondary: `${c.trees_planted} trees planted • ${c.trees_surviving} surviving`,
              value: `${c.points} pts`,
            }))}
          />
        )}
        {tab === "colleges" && (
          <List
            loading={!colleges}
            items={colleges?.map((c) => ({
              rank: c.rank,
              primary: c.college,
              secondary: `${c.trees} trees registered`,
              value: `${c.survival_rate}% survival`,
            }))}
          />
        )}
        {tab === "wards" && (
          <List
            loading={!wardRank}
            items={wardRank?.map((w) => ({
              rank: w.rank,
              primary: w.ward,
              secondary: `${w.trees} trees`,
              value: `${w.survival_rate}% survival`,
            }))}
          />
        )}
      </div>
    </div>
  );
}

function List({
  loading, items,
}: { loading: boolean; items?: { rank: number; primary: string; secondary: string; value: string }[] }) {
  if (loading) {
    return (
      <div className="divide-y divide-forest-900/5">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-forest-900/[0.03]" />)}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return <div className="px-6 py-14 text-center text-charcoal/50">No data yet.</div>;
  }
  return (
    <div className="divide-y divide-forest-900/5">
      {items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          className="flex items-center gap-4 px-6 py-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900/5 font-mono text-sm font-semibold text-forest-800">
            {it.rank <= 3 ? <Medal size={16} className={it.rank === 1 ? "text-amber" : it.rank === 2 ? "text-stone" : "text-amber-800"} /> : it.rank}
          </div>
          <div className="flex-1">
            <div className="font-medium text-charcoal/90">{it.primary}</div>
            <div className="text-xs text-charcoal/50">{it.secondary}</div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-forest-800">
            {it.rank === 1 && <Trophy size={14} className="text-amber" />}
            {it.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
