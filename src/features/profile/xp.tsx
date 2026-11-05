"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGetJson } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState, smallBtn } from "@/features/notebook/ui";
import { fmtDayTime } from "./format";
import type { LevelInfo, XpAward, XpEntry, XpEvent } from "./types";

const EVENT_LABEL: Record<XpEvent["eventType"], string> = {
  LESSON_COMPLETE: "Dars yakunlandi",
  TOPIC_COMPLETE: "Mavzu yakunlandi",
  QUIZ_TIER: "Mavzu testi",
  NOTE_VERIFIED: "Konspekt",
  PURCHASE: "Xarid",
};

/** Progress chizig'i: matn kesilmasin, reduced-motion'da animatsiya yo'q. */
export function XpBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-4 border-[3px] border-ink bg-white", className)}
    >
      <div className="h-full bg-acid motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Daraja kartasi (profil): daraja, progress, keyingi darajagacha. */
export function LevelCard({ level, totalXp, balance }: { level: LevelInfo; totalXp: number; balance: number }) {
  return (
    <section aria-label="Daraja" className="border-[3px] border-ink bg-white p-4 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="label">{level.level}-daraja</p>
        <p className="label tabular-nums">Jami: {totalXp} XP</p>
      </div>
      <p className="display-cond mt-1 break-words text-3xl sm:text-4xl">{level.title}</p>
      <XpBar pct={level.progressPct} className="mt-3" />
      <p className="mt-2 text-sm [overflow-wrap:anywhere]">
        {level.isMax ? (
          "Eng yuqori darajaga erishdingiz"
        ) : (
          <>
            <span className="font-bold tabular-nums">{level.xpToNext} XP</span> qoldi → {level.nextLevel}-daraja «{level.nextTitle}»
          </>
        )}
      </p>
      <p className="label mt-3 inline-block border-2 border-ink bg-paper-2 px-2 py-1 tabular-nums">Sarflash mumkin: {balance} XP</p>
    </section>
  );
}

/** Ixcham kartochka (dashboard). */
export function LevelMini({ level, totalXp }: { level: LevelInfo; totalXp: number }) {
  return (
    <section aria-label="XP progress" className="border-[3px] border-ink bg-white p-3 shadow-[4px_4px_0_0_var(--color-ink)] sm:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate font-display text-lg font-black leading-tight">
          {level.level}. {level.title}
        </p>
        <p className="label shrink-0 tabular-nums">{totalXp} XP</p>
      </div>
      <XpBar pct={level.progressPct} className="mt-2 h-3" />
      <p className="mt-1.5 text-xs text-ink/75 [overflow-wrap:anywhere]">
        {level.isMax ? "Maksimal daraja" : `Keyingi daraja uchun ${level.xpToNext} XP`}
      </p>
    </section>
  );
}

/**
 * Dars/test natijasi: FAQAT haqiqatan berilgan XP ko'rsatiladi. Takroriy yakunlashda "+XP" yo'q, sababi tushuntiriladi.
 */
export function XpResult({
  award,
  firstTime,
  kind,
  badges,
}: {
  award: XpAward | null | undefined;
  firstTime?: boolean;
  kind: "lesson" | "quiz";
  badges?: { slug: string; name: string }[];
}) {
  const real = award?.events.filter((e) => !e.duplicate && !e.disabled && e.grantedXp > 0) ?? [];
  const lowCoef = award?.events.find((e) => !e.duplicate && !e.disabled && e.baseXp > 0 && e.grantedXp === 0);
  return (
    <div role="status" aria-live="polite" className="mt-4 border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
      {award && award.grantedXp > 0 ? (
        <>
          <p className="display-cond text-3xl tabular-nums">+{award.grantedXp} XP</p>
          <ul className="mt-2 space-y-1 text-sm">
            {real.map((e, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-x-3">
                <span>{EVENT_LABEL[e.eventType]}</span>
                <span className="tabular-nums">
                  +{e.grantedXp}
                  {e.multiplierBp < 10_000 ? ` (${e.baseXp} × ${Math.round(e.multiplierBp / 100)}%)` : ""}
                </span>
              </li>
            ))}
          </ul>
          {real.some((e) => e.multiplierBp < 10_000) && (
            <p className="mt-2 text-xs text-ink/70">Bir kunda ko&apos;p mavzu o&apos;rganilsa, 2-mavzuga 50%, 3-mavzudan boshlab 10% XP beriladi.</p>
          )}
        </>
      ) : lowCoef ? (
        <p className="text-sm">Bugun bu mavzu uchun XP koeffitsiyenti juda past: bu safar XP berilmadi.</p>
      ) : kind === "quiz" ? (
        <p className="text-sm">Bu natija bilan yangi XP berilmadi: oldingi eng yaxshi natijangiz yetarli yoki bo&apos;sag&apos;a yetmadi.</p>
      ) : firstTime === false ? (
        <p className="text-sm">Bu dars avval yakunlangan: XP faqat birinchi marta beriladi.</p>
      ) : (
        <p className="text-sm">Dars yakunlandi.</p>
      )}
      {badges && badges.length > 0 && (
        <ul aria-label="Yangi badge" className="mt-3 space-y-1.5">
          {badges.map((b) => (
            <li key={b.slug} className="label border-[3px] border-ink bg-bubble px-3 py-2 [overflow-wrap:anywhere]">
              Yangi badge: {b.name}
            </li>
          ))}
        </ul>
      )}
      {award?.leveledUp && (
        <p className="label mt-3 border-[3px] border-ink bg-acid px-3 py-2 [overflow-wrap:anywhere]">
          Yangi daraja: {award.level.level}. {award.level.title}!
        </p>
      )}
    </div>
  );
}

/** XP tarixi: sahifalangan, "Yana yuklash". */
export function XpHistory() {
  const [items, setItems] = useState<XpEntry[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const load = useCallback(async (p: number) => {
    setBusy(true);
    const r = await apiGetJson<{ items: XpEntry[]; total: number }>(`/xp/history?page=${p}&limit=10`);
    setBusy(false);
    if (!r.ok) return setStatus("error");
    setItems((prev) => (p === 1 ? r.data.items : [...prev, ...r.data.items]));
    setTotal(r.data.total);
    setPage(p);
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    apiGetJson<{ items: XpEntry[]; total: number }>("/xp/history?page=1&limit=10").then((r) => {
      if (!r.ok) return setStatus("error");
      setItems(r.data.items);
      setTotal(r.data.total);
      setPage(1);
      setStatus("ready");
    });
  }, []);

  if (status === "loading") return <p className="label">Yuklanmoqda...</p>;
  if (status === "error") {
    return (
      <EmptyState title="XP tarixini yuklab bo'lmadi" action={<button type="button" className={smallBtn} onClick={() => load(1)}>Qayta urinish</button>} />
    );
  }
  if (items.length === 0) return <EmptyState title="Hali XP faoliyati yo'q">Dars yakunlang yoki mavzu testini topshiring.</EmptyState>;

  return (
    <div>
      <ul className="border-[3px] border-ink bg-white">
        {items.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 border-b-[3px] border-ink px-3 py-3 last:border-b-0 sm:px-4">
            <span className="min-w-0">
              <span className="block font-semibold [overflow-wrap:anywhere]">{e.label ?? EVENT_LABEL[e.eventType]}</span>
              <span className="label block text-[11px]">
                {fmtDayTime(e.createdAt)}
                {e.multiplierPct < 100 ? ` · ${e.baseXp} × ${e.multiplierPct}%` : ""}
              </span>
            </span>
            <span className={cn("shrink-0 font-display text-xl font-black tabular-nums", e.grantedXp === 0 && "text-ink/50")}>{e.grantedXp > 0 ? "+" : ""}{e.grantedXp}</span>
          </li>
        ))}
      </ul>
      {items.length < total && (
        <button type="button" disabled={busy} className={cn(smallBtn, "mt-3 w-full sm:w-auto")} onClick={() => load(page + 1)}>
          {busy ? "..." : `Yana yuklash (${items.length} / ${total})`}
        </button>
      )}
    </div>
  );
}
