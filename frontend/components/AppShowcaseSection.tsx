"use client";

import { motion } from "framer-motion";
import { Camera, MapPin, QrCode, Sprout } from "lucide-react";
import PhoneMockup from "@/components/PhoneMockup";
import AppFlow from "@/components/AppFlow";
import DownloadCard from "@/components/DownloadCard";

const BENEFITS = [
  { icon: Camera, title: "Live Camera", desc: "Capture real tree evidence." },
  { icon: MapPin, title: "Live GPS", desc: "Record the exact plantation location." },
  { icon: QrCode, title: "QR Passport", desc: "Give every tree a digital identity." },
  { icon: Sprout, title: "3-Year Survival", desc: "Track the tree beyond plantation day." },
];

export default function AppShowcaseSection() {
  return (
    <section id="get-the-app" className="scroll-mt-20 border-y border-forest-900/10 bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-14 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-forest-700">
            The Tree Starts With You
          </span>
          <h2 className="mt-3 text-balance font-display text-4xl font-medium text-forest-950 sm:text-5xl">
            Plant. Capture. Protect.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/60">
            Use the VrukshaSetu mobile app to register your planted tree with a live
            photo and GPS location, receive its digital QR Passport and continue
            tracking its survival.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "#download-app"}
              download={!!process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL}
              className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3.5 text-sm font-medium text-cream shadow-lg shadow-forest-900/20 transition-transform hover:scale-[1.03]"
            >
              Download VrukshaSetu App
            </a>
            <a
              href="#app-flow"
              className="inline-flex items-center gap-2 rounded-full border border-forest-900/20 px-6 py-3.5 text-sm font-medium text-forest-900 transition-colors hover:bg-white"
            >
              Learn How It Works
            </a>
          </div>
        </div>

        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
          <div className="order-1 lg:order-1">
            <PhoneMockup />
          </div>

          <div id="app-flow" className="order-2 scroll-mt-24 lg:order-2">
            <AppFlow />
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border border-forest-900/10 bg-white p-5 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-forest-900/5 text-forest-700">
                  <Icon size={18} />
                </div>
                <h4 className="text-sm font-semibold text-forest-950">{b.title}</h4>
                <p className="mt-1 text-xs text-charcoal/50">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Download card */}
        <div id="download-app" className="mt-12 scroll-mt-24">
          <DownloadCard />
        </div>
      </div>
    </section>
  );
}
