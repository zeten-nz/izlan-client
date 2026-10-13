"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import type { FilterOptions, SortKey, SourceView } from "./types";

export const inputCls =
  "w-full border-[3px] border-ink bg-white px-3 py-2.5 text-[17px] font-medium outline-none placeholder:text-ink/40 focus:bg-acid/40 focus-visible:outline-[3px] focus-visible:outline-cobalt disabled:opacity-50";

export const smallBtn =
  "inline-flex items-center justify-center border-[3px] border-ink bg-white px-3 py-1.5 font-display text-[13px] font-black uppercase tracking-tight hover:bg-acid disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-[3px] focus-visible:outline-cobalt";

export const primaryBtn =
  "inline-flex items-center justify-center border-[3px] border-ink bg-acid px-4 py-2.5 font-display text-[14px] font-black uppercase tracking-tight shadow-[4px_4px_0_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-[3px] focus-visible:outline-cobalt";

export function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function lessonHref(lessonId: string, pageId?: string | null) {
  return `${ROUTES.student}/lesson/${lessonId}${pageId ? `?page=${encodeURIComponent(pageId)}` : ""}`;
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && !error ? <span className="mt-1 block text-sm text-ink/60">{hint}</span> : null}
      {error ? (
        <span role="alert" className="mt-1 block text-sm font-bold text-tomato">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-[3px] border-dashed border-ink bg-white p-6 sm:p-8">
      <p className="display-cond text-2xl">{title}</p>
      {children ? <div className="mt-2 max-w-xl text-lg leading-snug">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadState({ status, error, onRetry }: { status: "loading" | "ready" | "error"; error: string; onRetry: () => void }) {
  if (status === "loading") {
    return (
      <p role="status" className="label border-[3px] border-ink bg-white p-4" data-testid="nb-loading">
        Yuklanmoqda…
      </p>
    );
  }
  if (status === "error") {
    return (
      <div role="alert" className="border-[3px] border-ink bg-tomato p-4 font-semibold">
        {error || "Yuklab bo'lmadi"}
        <button type="button" onClick={onRetry} className={cn(smallBtn, "ml-3")}>
          Qayta urinish
        </button>
      </div>
    );
  }
  return null;
}

/** O'chirishni tasdiqlash: bitta bosishda o'chmaydi. */
export function ConfirmDelete({ onConfirm, busy, what }: { onConfirm: () => void; busy?: boolean; what: string }) {
  const [ask, setAsk] = useState(false);
  if (!ask) {
    return (
      <button type="button" onClick={() => setAsk(true)} className={cn(smallBtn, "hover:bg-tomato")} aria-label={`${what}ni o'chirish`}>
        O&apos;chirish
      </button>
    );
  }
  return (
    <span role="group" aria-label="O'chirishni tasdiqlash" className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold">Rostdan o&apos;chirilsinmi?</span>
      <button type="button" disabled={busy} onClick={onConfirm} className={cn(smallBtn, "bg-tomato")} autoFocus>
        Ha, o&apos;chirish
      </button>
      <button type="button" onClick={() => setAsk(false)} className={smallBtn}>
        Bekor qilish
      </button>
    </span>
  );
}

/** Manba: darsga qaytish havolasi yoki nima uchun ochib bo'lmasligi. */
export function SourceLine({ source, pageLabel }: { source: SourceView; pageLabel?: string }) {
  const where = [source.directionTitle, source.topicTitle].filter(Boolean).join(" · ");
  const lesson = source.lessonTitle;
  let body: ReactNode = null;
  if (source.state === "ok" && source.lessonId) {
    body = (
      <Link href={lessonHref(source.lessonId, source.pageId)} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
        Darsga qaytish: {lesson}
        {pageLabel ? ` · ${pageLabel}` : ""} →
      </Link>
    );
  } else if (source.state === "locked") {
    body = <span className="text-ink/70">Dars: {lesson} · mavzu hali ochilmagan</span>;
  } else if (source.state === "unpublished" || source.state === "missing") {
    body = <span className="text-ink/70">Dars: {lesson || "noma'lum"} · bu dars endi mavjud emas</span>;
  }
  if (!where && !body) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {where ? <span className="label border-2 border-ink/40 px-1.5 py-0.5 text-[10px]">{where}</span> : null}
      {body}
    </p>
  );
}

type FilterProps = {
  options: FilterOptions;
  directionId: string;
  topicId: string;
  onDirection: (id: string) => void;
  onTopic: (id: string) => void;
  sort?: SortKey;
  onSort?: (s: SortKey) => void;
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
  extra?: ReactNode;
};

/** Qidiruv, yo'nalish/mavzu filtri va saralash — barcha bo'limlarda bir xil. */
export function Toolbar({ options, directionId, topicId, onDirection, onTopic, sort, onSort, search, extra }: FilterProps) {
  const topics = options.topics.filter((t) => !directionId || t.directionId === directionId);
  const sel = "border-[3px] border-ink bg-white px-2.5 py-2 text-[15px] font-semibold focus-visible:outline-[3px] focus-visible:outline-cobalt";
  return (
    <div className="flex flex-wrap items-center gap-2" role="search">
      {search ? (
        <input
          type="search"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder}
          aria-label="Qidirish"
          className={cn(inputCls, "min-w-[200px] flex-1 sm:max-w-sm")}
        />
      ) : null}
      {options.directions.length > 0 ? (
        <select
          aria-label="Yo'nalish bo'yicha filtr"
          value={directionId}
          onChange={(e) => {
            onDirection(e.target.value);
            onTopic("");
          }}
          className={sel}
        >
          <option value="">Barcha yo&apos;nalishlar</option>
          {options.directions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      ) : null}
      {topics.length > 0 ? (
        <select aria-label="Mavzu bo'yicha filtr" value={topicId} onChange={(e) => onTopic(e.target.value)} className={cn(sel, "max-w-[220px]")}>
          <option value="">Barcha mavzular</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      ) : null}
      {sort && onSort ? (
        <select aria-label="Saralash" value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className={sel}>
          <option value="new">Avval yangilari</option>
          <option value="old">Avval eskilari</option>
          <option value="az">A → Z</option>
        </select>
      ) : null}
      {extra}
    </div>
  );
}

export function LoadMore({ hasMore, loading, onClick, shown, total }: { hasMore: boolean; loading: boolean; onClick: () => void; shown: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="label">
        {shown} / {total} ta ko&apos;rsatilmoqda
      </p>
      {hasMore ? (
        <button type="button" onClick={onClick} disabled={loading} className={smallBtn}>
          {loading ? "Yuklanmoqda…" : "Yana ko'rsatish"}
        </button>
      ) : null}
    </div>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="border-[3px] border-ink bg-[#8df0a8] px-3 py-2 font-semibold">
      {children}
    </p>
  );
}

/** "Fan/mavzu" tanlash (mustaqil yozuv yaratishda): yo'nalish → ochiq mavzu. */
export function SourcePicker({
  options,
  directionId,
  topicId,
  onDirection,
  onTopic,
}: {
  options: FilterOptions;
  directionId: string;
  topicId: string;
  onDirection: (id: string) => void;
  onTopic: (id: string) => void;
}) {
  if (options.directions.length === 0) return null;
  const topics = options.topics.filter((t) => t.directionId === directionId);
  const sel = "w-full border-[3px] border-ink bg-white px-2.5 py-2.5 text-[16px] font-semibold focus-visible:outline-[3px] focus-visible:outline-cobalt";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Fan / yo'nalish (ixtiyoriy)">
        <select
          value={directionId}
          onChange={(e) => {
            onDirection(e.target.value);
            onTopic("");
          }}
          className={sel}
        >
          <option value="">Tanlanmagan</option>
          {options.directions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mavzu (ixtiyoriy)">
        <select value={topicId} onChange={(e) => onTopic(e.target.value)} disabled={!directionId || topics.length === 0} className={sel}>
          <option value="">Tanlanmagan</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
