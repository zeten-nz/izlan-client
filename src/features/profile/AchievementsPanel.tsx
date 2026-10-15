"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState, smallBtn } from "@/features/notebook/ui";
import { BadgeArt, BadgeCard, type BadgeItem } from "./badges";
import { fmtDay } from "./format";

export type AchievementsData = { showcaseMax: number; items: BadgeItem[] };

/** Yutuqlar: olingan va ochilmagan badge'lar, progress, tafsilot va asosiy (3 ta) badge tanlash. Ownership serverda tekshiriladi. */
export function AchievementsPanel({ data, onShowcase }: { data: AchievementsData; onShowcase?: (slugs: string[]) => void }) {
  const [items, setItems] = useState(data.items);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const earned = items.filter((i) => i.earned);
  const showcase = items
    .filter((i) => i.showcaseOrder !== null)
    .sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0))
    .map((i) => i.slug);
  const sel = items.find((i) => i.slug === open) ?? null;

  async function saveShowcase(slugs: string[]) {
    setBusy(true);
    setError("");
    const r = await apiSend("PUT", "/achievements/showcase", { slugs });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setItems((cur) => cur.map((i) => ({ ...i, showcaseOrder: slugs.includes(i.slug) ? slugs.indexOf(i.slug) + 1 : null })));
    onShowcase?.(slugs);
  }

  function toggle(slug: string) {
    if (showcase.includes(slug)) return void saveShowcase(showcase.filter((s) => s !== slug));
    if (showcase.length >= data.showcaseMax) return setError(`Ko'pi bilan ${data.showcaseMax} ta asosiy badge tanlash mumkin`);
    void saveShowcase([...showcase, slug]);
  }

  if (items.length === 0) return <EmptyState title="Yutuqlar hali yo'q">Yutuqlar haqiqiy o&apos;quv natijalari uchun beriladi va sotilmaydi.</EmptyState>;

  return (
    <div className="space-y-6">
      <section aria-label="Asosiy badge'lar">
        <h2 className="label">Asosiy badge&apos;lar ({showcase.length} / {data.showcaseMax})</h2>
        {showcase.length === 0 ? (
          <p className="mt-2 text-sm text-ink/75">Olingan badge&apos;lardan {data.showcaseMax} tasini profilingizda ko&apos;rsatish uchun tanlang.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-3">
            {showcase.map((slug) => {
              const b = items.find((i) => i.slug === slug)!;
              return (
                <li key={slug} className="flex items-center gap-2 border-[3px] border-ink bg-acid px-2 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">
                  <BadgeArt slug={slug} className="size-9" />
                  <span className="max-w-[9rem] truncate text-sm font-bold">{b.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {error && (
        <p role="alert" className="label border-2 border-ink bg-tomato px-2 py-1 text-paper">
          {error}
        </p>
      )}

      <section aria-label="Badge'lar">
        <h2 className="label">
          Olingan: {earned.length} / {items.length}
        </h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-2">
          {items.map((b) => (
            <li key={b.slug} className="min-w-0">
              <BadgeCard b={b} selected={open === b.slug} onOpen={() => setOpen(open === b.slug ? null : b.slug)} />
            </li>
          ))}
        </ul>
      </section>

      {sel && (
        <section aria-label="Badge tafsiloti" className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
          <div className="flex items-start gap-4">
            <BadgeArt slug={sel.slug} locked={!sel.earned} className="size-20 sm:size-24" />
            <div className="min-w-0">
              <h3 className="display-cond text-2xl [overflow-wrap:anywhere]">{sel.name}</h3>
              <p className="mt-1 text-sm [overflow-wrap:anywhere]">{sel.description}</p>
              <p className="label mt-2 [overflow-wrap:anywhere]">Talab: {sel.requirement}</p>
              {sel.earned ? (
                <p className="label mt-1">Olingan: {sel.earnedAt ? fmtDay(sel.earnedAt) : ""}</p>
              ) : sel.progress ? (
                <p className="label mt-1 tabular-nums">
                  Progress: {sel.progress.value} / {sel.progress.target}
                </p>
              ) : null}
            </div>
          </div>
          {sel.earned && (
            <button type="button" disabled={busy} className={cn(smallBtn, "mt-3")} aria-pressed={sel.showcaseOrder !== null} onClick={() => toggle(sel.slug)}>
              {sel.showcaseOrder !== null ? "Asosiy badge'dan olib tashlash" : "Asosiy badge qilish"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
