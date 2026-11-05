"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, inputCls, smallBtn } from "@/features/notebook/ui";
import { cn } from "@/lib/cn";
import { STATUS_LABEL, type RuleRow } from "./gapi";

const FILTERS = ["ALL", "DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED"] as const;
type StatusFilter = (typeof FILTERS)[number];
type Sort = "level" | "recent";
const PAGE_SIZE = 15;
const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2", "N5", "N4", "N3", "N2", "N1"];
const sel = cn(inputCls, "mt-1 py-2");

type Filters = { q: string; status: StatusFilter; mine: boolean; lang: string; level: string; cat: string; sort: Sort; page: number };

const storageKey = (base: string) => `izlan.grammarList${base}`;

function readFilters(sp: URLSearchParams, mineDefault: boolean): Filters {
  const status = sp.get("status") as StatusFilter | null;
  return {
    q: sp.get("q") ?? "",
    status: status && FILTERS.includes(status) ? status : "ALL",
    mine: sp.has("mine") ? sp.get("mine") === "1" : mineDefault,
    lang: sp.get("lang") ?? "",
    level: sp.get("level") ?? "",
    cat: sp.get("cat") ?? "",
    sort: sp.get("sort") === "recent" ? "recent" : "level",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

/** Filtr URL'da (va sessiyada) saqlanadi: qoidani ochib «← Qoidalar» orqali qaytganda ro'yxat o'sha holatda. */
function writeFilters(f: Filters, base: string, mineDefault: boolean) {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status !== "ALL") sp.set("status", f.status);
  if (f.mine !== mineDefault) sp.set("mine", f.mine ? "1" : "0");
  if (f.lang) sp.set("lang", f.lang);
  if (f.level) sp.set("level", f.level);
  if (f.cat) sp.set("cat", f.cat);
  if (f.sort !== "level") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  const qs = sp.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  try {
    sessionStorage.setItem(storageKey(base), qs);
  } catch {
    // saqlab bo'lmasa — faqat URL'da qoladi
  }
}

const levelRank = (r: RuleRow) => {
  const i = r.level?.value ? LEVEL_ORDER.indexOf(r.level.value) : -1;
  return i < 0 ? 99 : i;
};

/**
 * Qoidalar ro'yxati. `base` — /teacher/grammar yoki /admin/grammar. Boshqa muallifniki Teacher uchun faqat o'qish.
 * `categories` — kategoriya ID → o'zbekcha nom (til sozlamalaridan).
 */
export function RuleList({
  rules,
  base,
  role,
  categories = {},
}: {
  rules: RuleRow[];
  base: string;
  role: "TEACHER" | "ADMIN";
  categories?: Record<string, string>;
}) {
  const searchParams = useSearchParams();
  const mineDefault = role === "TEACHER";
  const [f, setF] = useState<Filters>(() => readFilters(new URLSearchParams(searchParams.toString()), mineDefault));
  const update = (patch: Partial<Filters>) => {
    // Har qanday filtr o'zgarsa — birinchi sahifaga
    const next = { ...f, page: 1, ...patch };
    setF(next);
    writeFilters(next, base, mineDefault);
  };

  const langs = useMemo(() => [...new Set(rules.map((r) => r.lang))].sort(), [rules]);
  const pool = useMemo(() => rules.filter((r) => !f.lang || r.lang === f.lang), [rules, f.lang]);
  const levels = useMemo(
    () => [...new Set(pool.map((r) => r.level?.value).filter((x): x is string => Boolean(x)))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b)),
    [pool],
  );
  const cats = useMemo(() => [...new Set(pool.map((r) => r.category))].sort((a, b) => (categories[a] ?? a).localeCompare(categories[b] ?? b)), [pool, categories]);

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = rules.filter((r) => {
      if (f.mine && !r.mine) return false;
      if (f.lang && r.lang !== f.lang) return false;
      if (f.level && r.level?.value !== f.level) return false;
      if (f.cat && r.category !== f.cat) return false;
      if (f.status !== "ALL" && !r.revisions.some((v) => v.status === f.status)) return false;
      const hay = `${r.id} ${r.slug} ${categories[r.category] ?? r.category} ${r.revisions.map((v) => v.title).join(" ")}`.toLowerCase();
      return !q || hay.includes(q);
    });
    if (f.sort === "level") {
      return [...out].sort((a, b) => a.lang.localeCompare(b.lang) || levelRank(a) - levelRank(b) || a.id.localeCompare(b.id));
    }
    return out; // server allaqachon oxirgi o'zgarish bo'yicha
  }, [rules, f, categories]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = Boolean(f.q || f.lang || f.level || f.cat || f.status !== "ALL" || f.mine !== mineDefault);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1">
          <span className="label">Qidiruv</span>
          <input className={cn(inputCls, "mt-1")} value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Sarlavha, slug, kategoriya yoki ID" />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-base font-bold">
          <input type="checkbox" className="size-5 accent-ink" checked={f.mine} onChange={(e) => update({ mine: e.target.checked })} />
          Faqat meniki
        </label>
      </div>

      <div className={cn("mt-3 grid gap-3", langs.length > 1 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
        {langs.length > 1 ? (
          <label className="block">
            <span className="label">Til</span>
            <select className={sel} value={f.lang} onChange={(e) => update({ lang: e.target.value, level: "", cat: "" })}>
              <option value="">Hammasi</option>
              {langs.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block">
          <span className="label">Daraja</span>
          <select className={sel} value={f.level} onChange={(e) => update({ level: e.target.value })}>
            <option value="">Hammasi</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Kategoriya</span>
          <select className={sel} value={f.cat} onChange={(e) => update({ cat: e.target.value })}>
            <option value="">Hammasi</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {categories[c] ?? c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Tartib</span>
          <select className={sel} value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
            <option value="level">Daraja bo&apos;yicha</option>
            <option value="recent">Oxirgi o&apos;zgarish</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Holat bo'yicha filtr">
        {FILTERS.map((s) => (
          <button key={s} type="button" aria-pressed={f.status === s} onClick={() => update({ status: s })} className={cn(smallBtn, f.status === s && "bg-ink! text-paper!")}>
            {s === "ALL" ? "Hammasi" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="label" aria-live="polite">
          {rows.length === rules.length ? `${rules.length} ta qoida` : `${rules.length} tadan ${rows.length} tasi topildi`}
        </p>
        {hasFilter ? (
          <button type="button" className={smallBtn} onClick={() => update({ q: "", lang: "", level: "", cat: "", status: "ALL", mine: mineDefault })}>
            Filtrni tozalash
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Qoida topilmadi">
            {f.mine && rules.length > 0 ? "«Faqat meniki» belgisini olib tashlab ko'ring — boshqa mualliflarning qoidalari yashirilgan." : "Filtrlarni o'zgartiring yoki yangi qoida yarating."}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" data-testid="rule-list">
          {visible.map((r) => {
            const v = r.revisions[0];
            return (
              <li key={r.id} className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${base}/${r.id}`} className="display-cond text-2xl underline-offset-4 hover:underline">
                    {v?.title || r.slug}
                  </Link>
                  {r.level?.value ? <span className="label border-[3px] border-ink bg-acid px-2 py-0.5">{r.level.value}</span> : null}
                  {v && <span className="label border-[3px] border-ink bg-paper px-2 py-0.5">{STATUS_LABEL[v.status]}</span>}
                  {r.hidden && <span className="label border-[3px] border-ink bg-ink px-2 py-0.5 text-paper">yashirilgan</span>}
                  {r.state === "RETIRED" && <span className="label border-[3px] border-ink bg-ink px-2 py-0.5 text-paper">nafaqada</span>}
                  {v?.selfApproved && <span className="label border-[3px] border-ink bg-tomato px-2 py-0.5">o&apos;zi tasdiqlagan</span>}
                  {!r.mine && role === "TEACHER" && <span className="label text-ink/60">faqat o&apos;qish</span>}
                </div>
                <p className="mt-1 text-sm text-ink/70">
                  {categories[r.category] ?? r.category} · {r.id} · {r.lang}/{r.slug} · {v?.authorLabel ?? (r.mine ? "siz" : "ustoz")} · {v?.provenance}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} pages={pages} onPage={(p) => update({ page: p })} />
    </div>
  );
}

/** Qoida sahifasidan ro'yxatga qaytish: oxirgi filtr (sessiyadan) bilan ochiladi. */
export function BackToRules({ base, children, className }: { base: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <Link
      href={base}
      className={className}
      onClick={(e) => {
        let saved: string | null = null;
        try {
          saved = sessionStorage.getItem(storageKey(base));
        } catch {
          // sessiya xotirasi yo'q — filtrsiz ochiladi
        }
        if (!saved) return;
        e.preventDefault();
        router.push(`${base}?${saved}`);
      }}
    >
      {children}
    </Link>
  );
}
