"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import type { UserDirection } from "../types";
import { OnboardingTrigger } from "./OnboardingTrigger";
import { Roadmap } from "./Roadmap";

const btn =
  "inline-flex items-center justify-center border-[3px] border-ink px-5 py-3 font-display text-[15px] font-black uppercase tracking-tight shadow-[4px_4px_0_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]";

/** Tanlangan yo'nalishlar: har biri uchun yo'l xaritasi va hozirgi mavzu. */
export function DirectionsPanel({ directions }: { directions: UserDirection[] }) {
  const [activeId, setActiveId] = useState(directions[0]?.directionId);
  const dir = directions.find((d) => d.directionId === activeId) ?? directions[0];
  if (!dir) return null;

  return (
    <div>
      {directions.length > 1 && (
        <div role="tablist" aria-label="Yo'nalishlar" className="mb-6 flex flex-wrap gap-2">
          {directions.map((d) => (
            <button
              key={d.directionId}
              role="tab"
              aria-selected={d.directionId === dir.directionId}
              type="button"
              onClick={() => setActiveId(d.directionId)}
              className={cn("label border-[3px] border-ink px-4 py-2.5", d.directionId === dir.directionId ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid")}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}

      {dir.currentLevelOrd === null ? <PendingLevel dir={dir} /> : <ActiveDirection dir={dir} />}
    </div>
  );
}

function PendingLevel({ dir }: { dir: UserDirection }) {
  return (
    <div className="border-[3px] border-ink bg-bubble p-5 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-8">
      <p className="label">{dir.title}</p>
      <h3 className="display-cond mt-2 text-[clamp(30px,5vw,48px)]">Darajangizni aniqlaymiz</h3>
      <p className="mt-2 max-w-xl text-lg leading-snug">
        Yo&apos;l xaritangizni tuzish uchun qaysi darajadan boshlashni tanlang: noldan, o&apos;zingiz kiritgan daraja yoki qisqa test orqali.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {dir.placementInProgress && (
          <Link href={`/student/test/${dir.placementInProgress}`} className={cn(btn, "bg-ink text-paper")}>
            Testni davom ettirish →
          </Link>
        )}
        <OnboardingTrigger request={{ step: "mode", directionId: dir.directionId }} className={cn(btn, "bg-acid")}>
          Darajani tanlash →
        </OnboardingTrigger>
      </div>
    </div>
  );
}

const introCache = new Map<string, "play" | "instant">();
const noopSubscribe = () => () => {};

/**
 * Xarita ochilish animatsiyasi faqat shu yo'nalish uchun BIRINCHI marta o'ynaladi; qayta kirganda darhol ko'rinadi.
 * Holat localStorage'da (ishlamasa — animatsiyasiz, ya'ni kutdirmaydi). Birinchi o'qilgan qiymat keshlanadi,
 * shuning uchun animatsiya o'ynab turganda holat o'zgarib, uni uzib qo'ymaydi. Serverda "pending".
 */
function useMapIntro(directionId: string): "pending" | "play" | "instant" {
  const mode = useSyncExternalStore<"pending" | "play" | "instant">(
    noopSubscribe,
    () => {
      const cached = introCache.get(directionId);
      if (cached) return cached;
      let seen = true;
      try {
        seen = window.localStorage.getItem(`izlan:map-seen:${directionId}`) !== null;
      } catch {
        seen = true;
      }
      const m = seen ? "instant" : "play";
      introCache.set(directionId, m);
      return m;
    },
    () => "pending",
  );
  useEffect(() => {
    try {
      window.localStorage.setItem(`izlan:map-seen:${directionId}`, "1");
    } catch {
      /* brauzer saqlashga ruxsat bermasa — keyingi safar ham animatsiya o'ynaydi, bu zararsiz */
    }
  }, [directionId]);
  return mode;
}

function ActiveDirection({ dir }: { dir: UserDirection }) {
  const topic = dir.currentTopic;
  const current = dir.levels.find((l) => l.state === "current");
  const intro = useMapIntro(dir.directionId);
  return (
    <div className="space-y-10">
      {topic && current && (
        <div className="relative border-[3px] border-ink bg-acid p-5 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-8">
          <span className="label absolute -top-4 right-4 rotate-3 border-[3px] border-ink bg-tomato px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">
            Hozirgi mavzu
          </span>
          <p className="label">{dir.title} · {current.code} · {current.title}</p>
          <h3 className="display mt-3 text-[clamp(30px,5vw,56px)] leading-[0.95]">{topic.title}</h3>
          <p className="mt-3 max-w-xl text-lg leading-snug">
            {dir.levelAccess === "OPEN"
              ? "Bu darajaning hamma mavzulari siz uchun ochiq. Xatolar ko'p bo'lgan mavzulardan boshlash foydali."
              : "Mavzular tartib bilan ochiladi. Hozirgi mavzudan boshlang."}
          </p>
          <Link href={`/student/topic/${topic.id}`} className={cn(btn, "mt-5 bg-ink text-paper")}>
            Mavzuga o&apos;tish →
          </Link>
        </div>
      )}
      <div>
        <h3 className="display-cond mb-6 text-3xl sm:text-4xl">Yo&apos;l xaritasi</h3>
        {intro === "pending" ? <div className="min-h-[320px]" aria-hidden /> : null}
        {intro !== "pending" ? <Roadmap
          key={dir.directionId + intro}
          variant={intro === "play" ? "preview" : "instant"}
          levels={dir.levels.map((l) => ({ ord: l.ord, code: l.code, title: l.title, summary: l.summary, vocabHint: l.vocabHint, state: l.state, topics: l.topics }))}
        /> : null}
      </div>
    </div>
  );
}

