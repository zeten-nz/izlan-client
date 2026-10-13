"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { LevelState, Topic } from "../types";

export type RoadmapLevel = {
  ord: number;
  code: string;
  title: string;
  summary?: string;
  vocabHint?: string;
  /** "future" — hali tanlanmagan/ko'rsatma uchun xarita (onboarding) */
  state: LevelState | "future";
  topics?: Topic[];
};

type Props = {
  levels: RoadmapLevel[];
  /** preview: sahifa ochilishi bilan ketma-ket animatsiya; full: skroll qilganda; instant: animatsiyasiz (qayta kirish) */
  variant?: "full" | "preview" | "instant";
};

const LOCK = (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
    <path d="M6 10V8a6 6 0 1 1 12 0v2h1v11H5V10h1zm2 0h8V8a4 4 0 1 0-8 0v2z" fill="currentColor" />
  </svg>
);

const CARD_TONE: Record<RoadmapLevel["state"], string> = {
  done: "bg-sky",
  current: "bg-acid",
  locked: "bg-paper-2 text-ink/70",
  future: "bg-white",
};

const STATE_LABEL: Record<RoadmapLevel["state"], string | null> = {
  done: "O'tilgan",
  current: "Siz shu yerda",
  locked: "Qulflangan",
  future: null,
};

function TopicList({ topics }: { topics: Topic[] }) {
  return (
    <ol className="mt-4 space-y-2">
      {topics.map((t) => {
        const enabled = t.state === "open" || t.state === "current";
        const inner = (
          <>
            <span className="grid size-7 shrink-0 place-items-center border-2 border-ink bg-paper font-mono text-xs font-bold">{t.ord}</span>
            <span className="min-w-0 flex-1 text-left font-semibold leading-tight">{t.title}</span>
            {t.state === "current" && <span className="label shrink-0 border-2 border-ink bg-tomato px-1.5 py-0.5 text-[10px]">Hozir</span>}
            {!enabled && <span className="text-ink/60">{LOCK}</span>}
          </>
        );
        return (
          <li key={t.id}>
            {enabled ? (
              <Link
                href={`/student/topic/${t.id}`}
                className={cn(
                  "flex items-center gap-3 border-[3px] border-ink px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-ink)]",
                  t.state === "current" ? "bg-white shadow-[3px_3px_0_0_var(--color-ink)]" : "bg-paper",
                )}
              >
                {inner}
              </Link>
            ) : (
              <div aria-disabled className="flex items-center gap-3 border-[3px] border-ink/30 px-3 py-2.5 text-ink/55">
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Node({ level, index, variant }: { level: RoadmapLevel; index: number; variant: "full" | "preview" | "instant" }) {
  const reducedPref = useReducedMotion();
  // prefers-reduced-motion yoki "instant" (xarita avval ko'rilgan) bo'lsa animatsiya yo'q
  const reduce = reducedPref || variant === "instant";
  const right = index % 2 === 1;
  const [open, setOpen] = useState(level.state === "current");
  const topics = level.topics ?? [];
  const label = STATE_LABEL[level.state];

  const motionProps = reduce
    ? {}
    : variant === "preview"
      ? {
          initial: { opacity: 0, y: 36, rotate: right ? 3 : -3 },
          animate: { opacity: 1, y: 0, rotate: 0 },
          transition: { delay: 0.5 + index * 0.28, type: "spring" as const, stiffness: 160, damping: 16 },
        }
      : {
          initial: { opacity: 0, y: 48, rotate: right ? 2.5 : -2.5 },
          whileInView: { opacity: 1, y: 0, rotate: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { type: "spring" as const, stiffness: 150, damping: 17 },
        };

  return (
    <li className="relative grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] md:gap-x-6">
      {/* Marker */}
      <div className="relative z-10 col-start-1 row-start-1 flex items-start justify-center md:col-start-2">
        <motion.div
          {...(reduce ? {} : { initial: { scale: 0 }, ...(variant === "preview" ? { animate: { scale: 1 } } : { whileInView: { scale: 1 }, viewport: { once: true } }), transition: { delay: variant === "preview" ? 0.4 + index * 0.28 : 0, type: "spring", stiffness: 260, damping: 14 } })}
          className="relative mt-5"
        >
          {level.state === "current" && !reduce && <span aria-hidden className="absolute inset-0 animate-ping border-[3px] border-ink bg-tomato/60" />}
          <span
            className={cn(
              "relative grid size-12 place-items-center border-[3px] border-ink font-display text-lg font-black shadow-[3px_3px_0_0_var(--color-ink)] md:size-14",
              level.state === "current" ? "bg-tomato" : level.state === "done" ? "bg-acid" : "bg-paper",
            )}
          >
            {level.state === "done" ? "✓" : level.state === "locked" ? LOCK : index + 1}
          </span>
        </motion.div>
      </div>

      {/* Karta */}
      <motion.div
        {...motionProps}
        className={cn(
          "col-start-2 row-start-1 mb-8 md:mb-10",
          right ? "md:col-start-3" : "md:col-start-1 md:row-start-1",
        )}
      >
        <div className={cn("border-[3px] border-ink p-4 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-5", CARD_TONE[level.state])}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="display text-[44px] leading-none sm:text-[56px]">{level.code}</span>
              <span className="display-cond text-xl sm:text-2xl">{level.title}</span>
            </div>
            {label && (
              <span
                className={cn(
                  "label border-[3px] border-ink px-2 py-1 shadow-[2px_2px_0_0_var(--color-ink)]",
                  level.state === "current" ? "animate-wobble bg-tomato" : "bg-paper",
                )}
              >
                {label}
              </span>
            )}
          </div>
          {level.summary && <p className="mt-2 leading-snug">{level.summary}</p>}
          {level.vocabHint && <p className="label mt-2 text-ink/70">{level.vocabHint}</p>}

          {topics.length > 0 && level.state !== "locked" && (
            <>
              {level.state !== "current" && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  className="label mt-3 border-[3px] border-ink bg-paper px-2.5 py-1.5 hover:bg-white"
                >
                  {open ? "Mavzularni yopish" : `Mavzular (${topics.length})`}
                </button>
              )}
              {open && <TopicList topics={topics} />}
            </>
          )}
          {topics.length > 0 && level.state === "locked" && <p className="label mt-3 flex items-center gap-2 text-ink/70">{LOCK} {topics.length} ta mavzu, avval oldingi bosqichni tugating</p>}
        </div>
      </motion.div>
    </li>
  );
}

/** Daraja yo'l xaritasi: markazdagi chiziq chiziladi, bosqichlar ketma-ket paydo bo'ladi. */
export function Roadmap({ levels, variant = "full" }: Props) {
  const reducedPref = useReducedMotion();
  const reduce = reducedPref || variant === "instant";
  return (
    <div className="relative">
      <motion.div
        aria-hidden
        {...(reduce ? {} : { initial: { scaleY: 0 }, ...(variant === "preview" ? { animate: { scaleY: 1 } } : { whileInView: { scaleY: 1 }, viewport: { once: true } }), transition: { duration: 1.4 + levels.length * 0.28, ease: "easeInOut" } })}
        style={{ transformOrigin: "top" }}
        className="absolute bottom-6 left-6 top-6 w-1.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-ink)_0_14px,transparent_14px_24px)] md:left-1/2"
      />
      <ol className="relative">
        {levels.map((l, i) => (
          <Node key={l.code} level={l} index={i} variant={variant} />
        ))}
      </ol>
    </div>
  );
}
