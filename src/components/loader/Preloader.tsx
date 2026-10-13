"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/brand/LogoMark";

const STORAGE_KEY = "izlan:preloaded";
const DURATION_MS = 1500;

/** <head> ichida ishlaydi: qayta tashrifda preloader umuman chizilmasligi uchun. */
export const preloaderBootScript = `try{if(sessionStorage.getItem("${STORAGE_KEY}"))document.documentElement.dataset.preloaded="1"}catch(e){}`;

/**
 * Sayt ochilganda ko‘rinadigan kirish ekrani (har sessiyada bir marta).
 * - 0 → 100 sanagich + progress
 * - tugagach ikki panel tepaga ochiladi
 * - JS bo‘lmasa yoki animatsiya kamaytirilgan bo‘lsa CSS o‘zi yashiradi (globals.css)
 */
export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    // Qayta tashrif: CSS (html[data-preloaded]) overlay'ni allaqachon yashirgan.
    if (root.dataset.preloaded === "1") return;
    document.body.style.overflow = "hidden";
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVisible(false);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  const finish = () => {
    document.body.style.overflow = "";
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    document.documentElement.dataset.preloaded = "1";
  };

  return (
    <AnimatePresence onExitComplete={finish}>
      {visible && (
        <motion.div
          key="preloader"
          className="preloader"
          role="status"
          aria-live="polite"
          aria-label="Yuklanmoqda"
          exit={{ transition: { duration: 0.9 } }}
        >
          {/* Ochiluvchi panellar */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-ink"
            exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-ink"
            exit={{ y: "100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
          />

          <motion.div
            className="relative z-10 flex flex-col items-center gap-8 px-6"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
          >
            <div className="perspective">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                className="preserve-3d"
              >
                <LogoMark className="size-24 border-4 border-paper" />
              </motion.div>
            </div>

            <div className="display text-[clamp(72px,16vw,160px)] tabular-nums text-acid">
              {String(progress).padStart(3, "0")}
            </div>

            <div className="h-3 w-[min(70vw,420px)] border-[3px] border-paper">
              <div className="h-full bg-acid" style={{ width: `${progress}%` }} />
            </div>

            <p className="label text-paper/80">Izlan · yo‘l qidirilmoqda</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
