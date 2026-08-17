"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Info } from "lucide-react";
import QRCode from "qrcode";

const APK_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || "";

export default function DownloadCard() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!APK_URL || typeof window === "undefined") return;
    const absoluteUrl = APK_URL.startsWith("http") ? APK_URL : `${window.location.origin}${APK_URL}`;
    QRCode.toDataURL(absoluteUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#0b3d2e", light: "#f5f3ea" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-forest-900/10 bg-forest-950 p-6 text-cream sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-forest-500">
            VrukshaSetu Mobile App
          </span>
          <p className="mt-2 font-display text-xl italic text-cream/90">
            &ldquo;Your tree. Your responsibility. Your impact.&rdquo;
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {APK_URL ? (
              <a
                href={APK_URL}
                download
                className="group inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-forest-950 transition-transform hover:scale-[1.03]"
              >
                <Download size={16} />
                Download for Android
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm font-medium text-cream/50">
                <Smartphone size={16} />
                Coming Soon
              </span>
            )}

            {PLAY_STORE_URL ? (
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-5 py-3 text-xs font-medium text-cream/70 hover:bg-white/5"
              >
                Get it on Google Play
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-5 py-3 text-xs font-medium text-cream/40">
                Google Play — Coming Soon
              </span>
            )}
          </div>

          {APK_URL && (
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-cream/40">
              <Info size={12} className="mt-0.5 shrink-0" />
              Direct APK download (debug build, hackathon demo). Android may show an
              &ldquo;install from unknown sources&rdquo; warning — this is expected for a
              non–Play Store build.
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-[132px] w-[132px] items-center justify-center rounded-xl bg-cream p-2">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Scan to download VrukshaSetu app" className="h-full w-full" />
            ) : (
              <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-0.5 opacity-30">
                {Array.from({ length: 36 }).map((_, i) => (
                  <span key={i} className={`rounded-sm ${i % 3 === 0 ? "bg-forest-950" : "bg-transparent"}`} />
                ))}
              </div>
            )}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">Scan to Download</span>
        </div>
      </div>
    </motion.div>
  );
}
