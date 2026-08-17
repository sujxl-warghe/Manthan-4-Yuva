"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, CheckCircle2, QrCode, Wifi, Battery, Signal } from "lucide-react";

const SCREENS = ["register", "success", "passport"] as const;
type ScreenKey = (typeof SCREENS)[number];

export default function PhoneMockup() {
  const [active, setActive] = useState<ScreenKey>("register");

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => {
        const idx = SCREENS.indexOf(prev);
        return SCREENS[(idx + 1) % SCREENS.length];
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Floating leaf particles */}
      <FloatingParticle className="left-[-24px] top-10" delay={0} />
      <FloatingParticle className="right-[-18px] top-32" delay={1.2} />
      <FloatingParticle className="left-[-10px] bottom-24" delay={2.1} />

      {/* Floating UI cards */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
        transition={{ opacity: { duration: 0.6, delay: 0.4 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -left-6 top-16 z-20 hidden rounded-xl border border-forest-900/10 bg-white px-3 py-2 shadow-lg shadow-forest-900/10 sm:flex sm:items-center sm:gap-2 lg:-left-10"
      >
        <CheckCircle2 size={14} className="text-forest-700" />
        <span className="text-xs font-medium text-charcoal/80">Photo Captured</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
        transition={{ opacity: { duration: 0.6, delay: 0.7 }, y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -right-6 bottom-28 z-20 hidden rounded-xl border border-forest-900/10 bg-white px-3 py-2 shadow-lg shadow-forest-900/10 sm:flex sm:items-center sm:gap-2 lg:-right-10"
      >
        <MapPin size={14} className="text-forest-700" />
        <span className="text-xs font-medium text-charcoal/80">GPS Locked</span>
      </motion.div>

      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        animate={{ y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.7 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="relative rounded-[2.5rem] border-[8px] border-forest-950 bg-forest-950 shadow-2xl shadow-forest-900/30"
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-30 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-forest-950" />

        {/* Status bar */}
        <div className="flex items-center justify-between rounded-t-[2rem] bg-cream px-5 pb-1 pt-2.5 text-[10px] text-charcoal/60">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <Signal size={10} />
            <Wifi size={10} />
            <Battery size={12} />
          </div>
        </div>

        {/* Screen */}
        <div className="relative h-[540px] w-[260px] overflow-hidden bg-cream">
          <AnimatePresence mode="wait">
            {active === "register" && <RegisterScreen key="register" />}
            {active === "success" && <SuccessScreen key="success" />}
            {active === "passport" && <PassportScreen key="passport" />}
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center rounded-b-[2rem] bg-cream py-2.5">
          <div className="h-1 w-24 rounded-full bg-charcoal/20" />
        </div>
      </motion.div>

      {/* Screen indicator dots */}
      <div className="mt-6 flex justify-center gap-1.5">
        {SCREENS.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            aria-label={`Show ${s} screen`}
            className={`h-1.5 rounded-full transition-all ${active === s ? "w-6 bg-forest-700" : "w-1.5 bg-forest-900/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex flex-col px-5 pt-5"
    >
      {children}
    </motion.div>
  );
}

function RegisterScreen() {
  return (
    <ScreenShell>
      <span className="font-mono text-[10px] uppercase tracking-widest text-forest-700">Register Tree</span>
      <h3 className="mt-1 font-display text-lg font-medium text-forest-950">Plant. Capture. Protect.</h3>

      <div className="relative mt-4 flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-forest-900/20 bg-forest-900/[0.03]">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-900 text-cream"
        >
          <Camera size={18} />
        </motion.div>
        <span className="absolute bottom-2 text-[10px] text-charcoal/40">Take Live Photo</span>
      </div>

      <div className="mt-4 rounded-xl border border-forest-900/10 bg-white p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-charcoal/50">
          <MapPin size={11} className="text-forest-700" />
          Nagpur, Maharashtra
        </div>
        <div className="mt-2 flex items-center gap-2">
          <motion.span
            className="relative flex h-2 w-2"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-forest-500" />
          </motion.span>
          <span className="text-[10px] font-medium text-forest-700">Capture Location</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FieldRow label="Species" value="Neem" />
        <FieldRow label="Category" value="Native" />
      </div>

      <div className="mt-auto mb-6 rounded-full bg-forest-900 py-2.5 text-center text-[11px] font-medium text-cream">
        REGISTER TREE
      </div>
    </ScreenShell>
  );
}

function SuccessScreen() {
  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-700/10 text-forest-700"
        >
          <CheckCircle2 size={30} />
        </motion.div>
        <h3 className="mt-4 font-display text-lg font-medium text-forest-950">Tree Registered!</h3>
        <span className="mt-1 font-mono text-xs text-forest-700">NGP-2026-000421</span>

        <div className="mt-6 w-full space-y-2 rounded-xl border border-forest-900/10 bg-white p-4 text-left">
          <FieldRow label="Location" value="Nagpur" />
          <FieldRow label="Status" value="Healthy" valueClass="text-forest-700" />
        </div>
      </div>
    </ScreenShell>
  );
}

function PassportScreen() {
  const checkpoints = [
    { label: "1 Month", done: true },
    { label: "6 Months", done: false },
    { label: "1 Year", done: false },
    { label: "3 Years", done: false },
  ];
  return (
    <ScreenShell>
      <span className="font-mono text-[10px] uppercase tracking-widest text-forest-700">Your Tree Passport</span>
      <h3 className="mt-1 font-display text-lg font-medium text-forest-950">Digital QR Passport</h3>

      <div className="relative mt-4 flex flex-col items-center rounded-xl bg-forest-950 p-5">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-lg bg-cream">
          <QrCode size={56} className="text-forest-950" />
          <motion.div
            className="absolute inset-x-2 h-0.5 bg-forest-500/80"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute" }}
          />
        </div>
        <span className="mt-3 font-mono text-xs text-cream">NGP-2026-000421</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {checkpoints.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            <CheckCircle2 size={13} className={c.done ? "text-forest-700" : "text-charcoal/20"} />
            <span className={c.done ? "text-charcoal/80" : "text-charcoal/40"}>{c.label}</span>
            <span className="ml-auto text-charcoal/30">{c.done ? "✓" : "—"}</span>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function FieldRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-forest-900/10 bg-white px-3 py-2">
      <span className="text-[10px] text-charcoal/40">{label}</span>
      <span className={`text-xs font-medium text-charcoal/80 ${valueClass}`}>{value}</span>
    </div>
  );
}

function FloatingParticle({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.div
      className={`pointer-events-none absolute z-10 text-forest-500/40 ${className}`}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 1, 0], y: [-10, -40] }}
      transition={{ duration: 3.5, repeat: Infinity, delay, ease: "easeOut" }}
    >
      🌿
    </motion.div>
  );
}
