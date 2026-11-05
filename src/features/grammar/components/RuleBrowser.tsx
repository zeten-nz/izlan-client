"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { grammarHref } from "@/config/routes";
import { cn } from "@/lib/cn";
import { LevelBadge } from "./LevelBadge";
import { filterEntries, type IndexEntry } from "@/lib/grammar/search";

type Category = { id: string; title: string };
type Props = { lang: string; entries: IndexEntry[]; categories: Category[]; levels: string[] };

const chip = (active: boolean) =>
  cn(
    "label min-h-11 border-[3px] border-ink px-3 py-2 text-left transition-colors",
    active ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid",
  );

/**
 * Qidiruv va filtrlar (client). Server to'liq ro'yxatni HTML sifatida chiqaradi (SEO/JS'siz),
 * filtr faqat ko'rinishni qisqartiradi. Holat `?q=&category=&level=` bilan sinxronlanadi.
 */
// Holat URL'da (?q=&category=&level=): tashqi manba sifatida o'qiladi, shuning uchun effect ichida setState kerak emas.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
};
const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

export function RuleBrowser({ lang, entries, categories, levels }: Props) {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const params = new URLSearchParams(search);
  const q = params.get("q") ?? "";
  const rawCategory = params.get("category");
  const rawLevel = params.get("level");
  const category = rawCategory && categories.some((x) => x.id === rawCategory) ? rawCategory : null;
  const level = rawLevel && levels.includes(rawLevel) ? rawLevel : null;

  const update = (next: { q?: string; category?: string | null; level?: string | null }) => {
    const nq = next.q ?? q;
    const nc = next.category === undefined ? category : next.category;
    const nl = next.level === undefined ? level : next.level;
    const p = new URLSearchParams();
    if (nq) p.set("q", nq);
    if (nc) p.set("category", nc);
    if (nl) p.set("level", nl);
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
    listeners.forEach((cb) => cb());
  };

  const results = useMemo(() => filterEntries(entries, { q, category, level }), [entries, q, category, level]);
  const filtering = q.trim() !== "" || category !== null || level !== null;
  const titleOf = (id: string) => categories.find((c) => c.id === id)?.title ?? id;

  if (entries.length === 0) {
    return (
      <div className="border-[3px] border-ink bg-white p-6 shadow-[6px_6px_0_0_var(--color-ink)]">
        <p className="display-cond text-3xl">Hozircha qoidalar yo‘q</p>
        <p className="mt-2 text-lg">Bu til uchun tekshirilgan grammatika qoidalari tez orada qo‘shiladi.</p>
      </div>
    );
  }

  const groups = filtering && q.trim()
    ? [{ id: "natija", title: "Qidiruv natijasi", items: results }]
    : categories
        .map((c) => ({ id: c.id, title: c.title, items: results.filter((r) => r.category === c.id) }))
        .filter((g) => g.items.length > 0);

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="border-[3px] border-ink bg-white p-4 shadow-[6px_6px_0_0_var(--color-ink)]">
        <label htmlFor="grammar-q" className="label mb-2 block">Qoida qidirish</label>
        <div className="flex gap-2">
          <input
            id="grammar-q"
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Masalan: present perfect"
            autoComplete="off"
            className="min-h-12 w-full min-w-0 border-[3px] border-ink bg-paper px-3 text-lg outline-none focus-visible:outline-[3px] focus-visible:outline-cobalt"
          />
          {filtering && (
            <button
              type="button"
              onClick={() => update({ q: "", category: null, level: null })}
              className={cn(chip(false), "shrink-0")}
            >
              Tozalash
            </button>
          )}
        </div>

        <fieldset className="mt-4">
          <legend className="label mb-2">Kategoriya</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={category === null} className={chip(category === null)} onClick={() => update({ category: null })}>
              Hammasi
            </button>
            {categories
              .filter((c) => entries.some((e) => e.category === c.id))
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={category === c.id}
                  className={chip(category === c.id)}
                  onClick={() => update({ category: category === c.id ? null : c.id })}
                >
                  {c.title}
                </button>
              ))}
          </div>
        </fieldset>

        {levels.length > 0 && (
          <fieldset className="mt-4">
            <legend className="label mb-2">Daraja</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={level === null} className={chip(level === null)} onClick={() => update({ level: null })}>
                Hammasi
              </button>
              {levels.map((l) => (
                <button key={l} type="button" aria-pressed={level === l} className={chip(level === l)} onClick={() => update({ level: level === l ? null : l })}>
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </form>

      <p className="label mt-6" role="status" aria-live="polite">
        {results.length} ta qoida{filtering ? " topildi" : ""}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 border-[3px] border-ink bg-white p-6">
          <p className="display-cond text-3xl">Hech narsa topilmadi</p>
          <p className="mt-2 text-lg">Boshqa so‘z bilan urinib ko‘ring yoki filtrlarni tozalang.</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`cat-${g.id}`} className="mt-8">
            <h2 id={`cat-${g.id}`} className="display-cond mb-4 border-b-[3px] border-ink pb-2 text-[clamp(26px,3.6vw,40px)]">
              {g.title}
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {g.items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={grammarHref(lang, r.slug)}
                    className="group block h-full border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-ink)]"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display text-xl font-black leading-tight">{r.title}</span>
                      {r.level && <LevelBadge value={r.level} confirmed={r.levelConfirmed} />}
                    </span>
                    <span className="mt-2 block text-base text-ink/80">{r.summary}</span>
                    {filtering && q.trim() && <span className="label mt-3 block text-ink/60">{titleOf(r.category)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
