"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, MapPin, QrCode } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { api, API_BASE, ApiError } from "@/lib/api";

interface Checkpoint { checkpoint: string; due_date: string; reached: boolean; verified: boolean }
interface Passport {
  id: string; tree_code: string; species: string | null; category: string | null;
  ward: string | null; latitude: number; longitude: number; address_hint: string | null;
  plantation_date: string; status: string; last_verified_at: string | null;
  survival_days: number; survival_duration_label: string;
  timeline: Checkpoint[]; next_checkpoint: Checkpoint | null; qr_url: string;
}

const CHECKPOINT_LABELS: Record<string, string> = {
  "1_MONTH": "1 Month",
  "6_MONTHS": "6 Months",
  "1_YEAR": "1 Year",
  "3_YEARS": "3 Years",
};

export default function TreePassportPage() {
  const { id } = useParams<{ id: string }>();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Passport>(`/api/v1/public/trees/${id}/passport`)
      .then(setPassport)
      .catch((e: ApiError) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-forest-950">Tree Not Found</h1>
        <p className="mt-2 text-charcoal/60">No tree passport exists for &ldquo;{id}&rdquo;.</p>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16">
        <div className="h-96 animate-pulse rounded-3xl bg-forest-900/5" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl border border-forest-900/10 bg-white shadow-xl shadow-forest-900/5"
      >
        {/* Header strip */}
        <div className="bg-forest-950 px-8 py-6 text-cream">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-forest-500">
                Digital Tree Passport
              </span>
              <div className="mt-1 font-mono text-2xl font-medium tracking-tight">{passport.tree_code}</div>
            </div>
            <QrCode size={40} className="text-cream/40" />
          </div>
        </div>

        <div className="grid gap-8 p-8 md:grid-cols-[1fr_180px]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <StatusBadge status={passport.status} />
              <span className="text-sm text-charcoal/50">
                Surviving for <strong className="text-charcoal/80">{passport.survival_duration_label}</strong>
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              <Field label="Species" value={passport.species || "—"} />
              <Field label="Category" value={passport.category || "—"} />
              <Field label="Ward" value={passport.ward || "—"} />
              <Field label="Plantation Date" value={new Date(passport.plantation_date).toLocaleDateString()} />
              <Field
                label="Last Verified"
                value={passport.last_verified_at ? new Date(passport.last_verified_at).toLocaleDateString() : "Pending"}
              />
              <Field label="Location" value={
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {passport.address_hint || `${passport.latitude.toFixed(4)}, ${passport.longitude.toFixed(4)}`}
                </span>
              } />
            </dl>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-forest-900/10 bg-cream p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${API_BASE}${passport.qr_url}`}
              alt={`QR code for ${passport.tree_code}`}
              className="h-32 w-32"
            />
            <span className="mt-2 font-mono text-[10px] text-charcoal/40">Scan to verify</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t border-forest-900/10 px-8 py-8">
          <h3 className="mb-6 font-display text-lg font-medium text-forest-950">Survival Timeline</h3>
          <div className="relative flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
            <TimelineStep label="Planted" done reached />
            {passport.timeline.map((cp) => (
              <TimelineStep
                key={cp.checkpoint}
                label={CHECKPOINT_LABELS[cp.checkpoint] || cp.checkpoint}
                done={cp.verified}
                reached={cp.reached}
                date={cp.due_date}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-charcoal/40">{label}</dt>
      <dd className="mt-1 font-medium text-charcoal/80">{value}</dd>
    </div>
  );
}

function TimelineStep({
  label, done, reached, date,
}: { label: string; done: boolean; reached: boolean; date?: string }) {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-2 py-3 text-center sm:py-0">
      <div className="hidden h-px flex-1 bg-forest-900/10 sm:absolute sm:left-[-50%] sm:top-[11px] sm:block sm:w-full" />
      {done ? (
        <CheckCircle2 size={22} className="relative z-10 bg-white text-forest-700" />
      ) : (
        <Circle size={22} className={`relative z-10 bg-white ${reached ? "text-amber" : "text-charcoal/20"}`} />
      )}
      <span className={`text-xs font-medium ${done ? "text-forest-800" : "text-charcoal/40"}`}>{label}</span>
      {date && <span className="text-[10px] text-charcoal/30">{new Date(date).toLocaleDateString()}</span>}
    </div>
  );
}
