"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, MapPin, ScanLine, TrendingUp, Users, ShieldCheck,
  Trophy, Sprout, AlertTriangle, Smartphone,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import HeroMap from "@/components/HeroMap";
import AppShowcaseSection from "@/components/AppShowcaseSection";
import { api, PublicStats, ApiError } from "@/lib/api";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PublicStats>("/api/v1/public/statistics")
      .then(setStats)
      .catch((e: ApiError) => setError(e.message));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-grain">
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream to-forest-900/5" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-forest-900/15 bg-white/60 px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-forest-800">
              Nagpur • Maharashtra
            </span>
          </motion.div>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <motion.h1
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-balance font-display text-5xl font-medium leading-[1.05] text-forest-950 sm:text-6xl lg:text-7xl"
              >
                Every tree
                <br />
                counts.{" "}
                <span className="italic text-forest-700">Survival</span>
                <br />
                matters.
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ delay: 0.25 }}
                className="mt-6 max-w-lg text-lg leading-relaxed text-charcoal/70"
              >
                VrukshaSetu connects Nagpur&apos;s planted trees to real locations, real guardians
                and real survival evidence — from the day they&apos;re planted to three years on.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ delay: 0.4 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/green-map"
                  className="group inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-sm font-medium text-cream shadow-lg shadow-forest-900/20 transition-transform hover:scale-[1.03]"
                >
                  Explore Green Map
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/impact"
                  className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 bg-white/50 px-6 py-3.5 text-sm font-medium text-forest-900 transition-colors hover:bg-white"
                >
                  View Public Dashboard
                </Link>
                <a
                  href="#get-the-app"
                  className="inline-flex items-center gap-1.5 px-2 py-3.5 text-sm font-medium text-forest-700 underline decoration-forest-700/30 underline-offset-4 transition-colors hover:text-forest-900"
                >
                  <Smartphone size={14} />
                  Get the App
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroMap />
            </motion.div>
          </div>
        </div>
      </section>

      {/* LIVE CITY STATISTICS */}
      <section className="border-y border-forest-900/10 bg-forest-950 py-16 text-cream">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-2xl font-medium sm:text-3xl">Live City Statistics</h2>
            {error && <span className="text-xs text-red-300">Live data unavailable — {error}</span>}
          </div>

          {!stats && !error && (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
              <Stat label="Trees Registered" value={stats.trees_registered} icon={<Sprout size={16} />} />
              <Stat label="Trees Surviving" value={stats.trees_surviving} icon={<ShieldCheck size={16} />} />
              <Stat label="Trees At Risk" value={stats.trees_at_risk} icon={<AlertTriangle size={16} />} />
              <Stat label="Dead / Missing" value={stats.dead_missing} icon={<AlertTriangle size={16} />} />
              <Stat label="Tree Guardians" value={stats.tree_guardians} icon={<Users size={16} />} />
              <Stat label="Wards Covered" value={stats.wards_covered} icon={<MapPin size={16} />} />
              <Stat label="Survival Rate" value={stats.survival_rate} suffix="%" decimals={1} icon={<TrendingUp size={16} />} />
            </div>
          )}
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-forest-700">The Platform</span>
          <h2 className="mt-3 text-balance font-display text-3xl font-medium text-forest-950 sm:text-4xl">
            Planting is not the achievement. Survival is.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<MapPin size={20} />}
            title="Nagpur Green Map"
            desc="Every tree, mapped in real time — filter by ward, species, category or drive, and open its Digital Tree Passport."
            href="/green-map"
          />
          <FeatureCard
            icon={<ScanLine size={20} />}
            title="AI-Assisted Verification"
            desc="GPS match, photo similarity and duplicate checks flag risk automatically — demo mode, clearly labeled."
            href="/green-map"
          />
          <FeatureCard
            icon={<TrendingUp size={20} />}
            title="Survival Analytics"
            desc="Plantation trends, ward comparisons and species survival — calculated live from the database."
            href="/impact"
          />
          <FeatureCard
            icon={<ShieldCheck size={20} />}
            title="Accountability Center"
            desc="Guardian → Supervisor → Institution → Authority. Every open issue tracked to resolution or escalation."
            href="/impact"
          />
          <FeatureCard
            icon={<Trophy size={20} />}
            title="College Green League"
            desc="Institutions ranked by survival, not plantation count. Green Points and badges reward real care."
            href="/leaderboard"
          />
          <FeatureCard
            icon={<Sprout size={20} />}
            title="Replacement Tracking"
            desc="When a tree fails, its replacement inherits a fresh survival timeline — nothing disappears quietly."
            href="/registry"
          />
        </div>
      </section>

      {/* MOBILE APP SHOWCASE */}
      <AppShowcaseSection />

      {/* CTA */}
      <section className="bg-forest-900 py-20 text-cream">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
          <h2 className="text-balance font-display text-3xl font-medium sm:text-4xl">
            &ldquo;Don&apos;t count trees. Count survivors.&rdquo;
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Explore the registry, trace a Tree Passport by its ID, or see how your ward stacks up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/registry"
              className="rounded-full bg-cream px-6 py-3.5 text-sm font-medium text-forest-950 hover:bg-white"
            >
              Search the Registry
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-cream/30 px-6 py-3.5 text-sm font-medium text-cream hover:bg-white/10"
            >
              About the Mission
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label, value, suffix = "", decimals = 0, icon,
}: { label: string; value: number; suffix?: string; decimals?: number; icon: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-forest-500">{icon}</div>
      <div className="text-3xl font-semibold sm:text-4xl">
        <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
      </div>
      <div className="mt-1 text-xs text-cream/50">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon, title, desc, href,
}: { icon: React.ReactNode; title: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group h-full rounded-2xl border border-forest-900/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-forest-900/5"
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-forest-900/5 text-forest-700 transition-colors group-hover:bg-forest-900 group-hover:text-cream">
          {icon}
        </div>
        <h3 className="font-display text-lg font-medium text-forest-950">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{desc}</p>
      </motion.div>
    </Link>
  );
}
