"use client";

import { motion } from "framer-motion";
import { Sprout, Camera, MapPin, RefreshCw, QrCode, ShieldCheck } from "lucide-react";

const STEPS = [
  { n: "01", label: "PLANT", desc: "Plant your tree.", icon: Sprout },
  { n: "02", label: "CAPTURE", desc: "Take a LIVE photo using the mobile camera.", icon: Camera },
  { n: "03", label: "LOCATE", desc: "Capture the tree's LIVE GPS location.", icon: MapPin },
  { n: "04", label: "SYNC", desc: "Tree information is synced with VrukshaSetu.", icon: RefreshCw },
  { n: "05", label: "GET YOUR PASSPORT", desc: "Receive a unique QR Digital Tree Passport.", icon: QrCode },
  { n: "06", label: "PROTECT", desc: "Track the tree through its 3-year survival journey.", icon: ShieldCheck },
];

export default function AppFlow() {
  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-900 text-cream">
                <Icon size={16} />
              </div>
              {i < STEPS.length - 1 && <div className="my-1 h-full w-px flex-1 bg-forest-900/15" />}
            </div>
            <div className="pb-7">
              <span className="font-mono text-[10px] tracking-widest text-forest-700">{step.n}</span>
              <h4 className="font-display text-base font-medium text-forest-950">{step.label}</h4>
              <p className="mt-0.5 text-sm text-charcoal/60">{step.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
