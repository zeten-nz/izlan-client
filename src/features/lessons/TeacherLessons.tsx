"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { apiPost, apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";

export type CatalogDirection = { id: string; title: string; levels: { id: string; code: string; title: string; topics: { id: string; ord: number; title: string }[] }[] };
export type LessonRow = {
  id: string;
  title: string;
  updatedAt: string;
  published: { rev: number; at: string } | null;
  topic: { id: string; title: string; ord: number; levelId: string; levelCode: string; levelOrd: number; directionId: string; directionTitle: string };
  /** Dastur tartibi: [yo'nalish, daraja, mavzu, dars] */
  order: number[];
};

const sel = "w-full border-[3px] border-ink bg-white px-3 py-2 font-medium outline-none focus:bg-acid/40";
const small = "border-[3px] border-ink bg-white px-3 py-1.5 text-sm font-bold hover:bg-acid disabled:opacity-40";

const PAGE_SIZE = 10;
type Status = "all" | "published" | "draft";
type Sort = "course" | "recent";
type Filters = { q: string; dir: string; level: string; topic: string; status: Status; sort: Sort; page: number };

/** Filtr URL'da saqlanadi: darsni tahrirlab qaytganda ro'yxat o'sha holatda ochiladi. */
function readFilters(sp: URLSearchParams): Filters {
  const status = sp.get("status");
  return {
    q: sp.get("q") ?? "",
    dir: sp.get("dir") ?? "",
    level: sp.get("level") ?? "",
    topic: sp.get("topic") ?? "",
    status: status === "published" || status === "draft" ? status : "all",
    sort: sp.get("sort") === "recent" ? "recent" : "course",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

function writeFilters(f: Filters) {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.dir) sp.set("dir", f.dir);
  if (f.level) sp.set("level", f.level);
  if (f.topic) sp.set("topic", f.topic);
  if (f.status !== "all") sp.set("status", f.status);
  if (f.sort !== "course") sp.set("sort", f.sort);
  if (f.page > 1) sp.set("page", String(f.page));
  const qs = sp.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  try {
    sessionStorage.setItem(FILTER_KEY, qs);
  } catch {
    // saqlab bo'lmasa — faqat URL'da qoladi
  }
}

const FILTER_KEY = "izlan.teacherLessons.filters";

/** Muharrirdan ro'yxatga qaytish: oxirgi filtr (sessiyadan) bilan ochiladi. */
export function BackToLessons({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href="/teacher/lessons"
      className={className}
      onClick={(e) => {
        let saved: string | null = null;
        try {
          saved = sessionStorage.getItem(FILTER_KEY);
        } catch {
          // sessiya xotirasi yo'q — filtrsiz ochiladi
        }
        if (!saved) return;
        e.preventDefault();
        router.push(`/teacher/lessons?${saved}`);
      }}
    >
      {children}
    </Link>
  );
}

const norm = (s: string) => s.toLocaleLowerCase("uz").replace(/[ʻʼ‘’`´]/g, "'");

const byOrder = (a: LessonRow, b: LessonRow) => {
  for (let i = 0; i < 4; i++) if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i];
  return a.title.localeCompare(b.title);
};

export function TeacherLessons({ lessons, directions }: { lessons: LessonRow[]; directions: CatalogDirection[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => readFilters(new URLSearchParams(searchParams.toString())));
  const update = (patch: Partial<Filters>) => {
    // Har qanday filtr o'zgarsa — birinchi sahifaga; faqat sahifa o'zgarsa — o'sha sahifa
    const next = { ...filters, page: 1, ...patch };
    setFilters(next);
    writeFilters(next);
  };

  const fLevels = useMemo(() => directions.find((d) => d.id === filters.dir)?.levels ?? [], [directions, filters.dir]);
  const fTopics = useMemo(() => fLevels.find((l) => l.id === filters.level)?.topics ?? [], [fLevels, filters.level]);

  const filtered = useMemo(() => {
    const q = norm(filters.q.trim());
    const rows = lessons.filter(
      (l) =>
        (!filters.dir || l.topic.directionId === filters.dir) &&
        (!filters.level || l.topic.levelId === filters.level) &&
        (!filters.topic || l.topic.id === filters.topic) &&
        (filters.status === "all" || (filters.status === "published") === Boolean(l.published)) &&
        (!q || norm(l.title).includes(q) || norm(l.topic.title).includes(q)),
    );
    return filters.sort === "course" ? [...rows].sort(byOrder) : rows; // server allaqachon updatedAt desc
  }, [lessons, filters]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = Boolean(filters.q || filters.dir || filters.status !== "all");
  const [dirId, setDirId] = useState(directions[0]?.id ?? "");
  const levels = useMemo(() => directions.find((d) => d.id === dirId)?.levels ?? [], [directions, dirId]);
  const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
  const topics = useMemo(() => levels.find((l) => l.id === levelId)?.topics ?? [], [levels, levelId]);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy("create");
    setError(null);
    const r = await apiPost<{ id: string }>("/staff/lessons", { topicId, title });
    if (r.ok) router.push(`/teacher/lessons/${r.data.id}`);
    else {
      setError(r.fieldErrors.title ?? r.fieldErrors.topicId ?? r.message);
      setBusy(null);
    }
  };

  const act = async (id: string, what: "duplicate" | "unpublish" | "delete") => {
    if (what === "delete" && !window.confirm("Dars butunlay o'chirilsinmi?")) return;
    setBusy(id);
    setError(null);
    const r = what === "delete" ? await apiSend("DELETE", `/staff/lessons/${id}`) : await apiPost(`/staff/lessons/${id}/${what}`, {});
    setBusy(null);
    if (!r.ok) setError(r.message);
    else router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8 sm:py-12">
      <p className="label">Ustoz paneli</p>
      <h1 className="display mt-2 text-[clamp(32px,6vw,72px)]">
        Darslarim<span className="text-tomato">.</span>
      </h1>

      <section className="mt-8 border-[3px] border-ink bg-acid p-5 shadow-[8px_8px_0_0_var(--color-ink)]">
        <p className="display-cond text-2xl">Yangi dars</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label>
            <span className="label mb-1 block">Yo&apos;nalish</span>
            <select
              className={sel}
              value={dirId}
              onChange={(e) => {
                const d = directions.find((x) => x.id === e.target.value);
                setDirId(e.target.value);
                setLevelId(d?.levels[0]?.id ?? "");
                setTopicId(d?.levels[0]?.topics[0]?.id ?? "");
              }}
            >
              {directions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label mb-1 block">Daraja</span>
            <select
              className={sel}
              value={levelId}
              onChange={(e) => {
                setLevelId(e.target.value);
                setTopicId(levels.find((l) => l.id === e.target.value)?.topics[0]?.id ?? "");
              }}
            >
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} · {l.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label mb-1 block">Mavzu</span>
            <select className={sel} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ord}. {t.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <input className={cn(sel, "min-w-60 flex-1")} placeholder="Dars nomi" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} aria-label="Dars nomi" />
          <button type="button" className={cn(buttonClasses("ink"), "disabled:opacity-50")} disabled={!topicId || !title.trim() || busy === "create"} onClick={create}>
            {busy === "create" ? "…" : "Yaratish →"}
          </button>
        </div>
      </section>

      {error ? (
        <p role="alert" className="mt-4 border-[3px] border-ink bg-tomato p-3 font-semibold">
          {error}
        </p>
      ) : null}

      {lessons.length > 0 ? (
        <section className="mt-8 border-[3px] border-ink bg-white p-4" aria-label="Qidiruv va filtr">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
            <label>
              <span className="label mb-1 block">Qidiruv</span>
              <input
                type="search"
                className={sel}
                placeholder="Dars yoki mavzu nomi…"
                value={filters.q}
                onChange={(e) => update({ q: e.target.value })}
              />
            </label>
            <label>
              <span className="label mb-1 block">Holati</span>
              <select className={sel} value={filters.status} onChange={(e) => update({ status: e.target.value as Status })}>
                <option value="all">Hammasi</option>
                <option value="published">Nashr qilingan</option>
                <option value="draft">Qoralama</option>
              </select>
            </label>
            <label>
              <span className="label mb-1 block">Tartib</span>
              <select className={sel} value={filters.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
                <option value="course">Dastur bo&apos;yicha</option>
                <option value="recent">Oxirgi o&apos;zgarish</option>
              </select>
            </label>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label>
              <span className="label mb-1 block">Yo&apos;nalish</span>
              <select className={sel} value={filters.dir} onChange={(e) => update({ dir: e.target.value, level: "", topic: "" })}>
                <option value="">Hammasi</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label mb-1 block">Daraja</span>
              <select className={sel} value={filters.level} disabled={!filters.dir} onChange={(e) => update({ level: e.target.value, topic: "" })}>
                <option value="">Hammasi</option>
                {fLevels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} · {l.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label mb-1 block">Mavzu</span>
              <select className={sel} value={filters.topic} disabled={!filters.level} onChange={(e) => update({ topic: e.target.value })}>
                <option value="">Hammasi</option>
                {fTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ord}. {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="label" aria-live="polite">
              {filtered.length === lessons.length ? `${lessons.length} ta dars` : `${lessons.length} tadan ${filtered.length} tasi topildi`}
            </p>
            {hasFilter ? (
              <button type="button" className={small} onClick={() => update({ q: "", dir: "", level: "", topic: "", status: "all" })}>
                Filtrni tozalash
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {lessons.length === 0 ? (
        <p className="mt-8 border-[3px] border-dashed border-ink bg-white p-6 text-lg">Hali dars yo&apos;q. Yuqorida mavzuni tanlab, birinchi darsni yarating.</p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 border-[3px] border-dashed border-ink bg-white p-6 text-lg">Hech narsa topilmadi. Qidiruv so&apos;zini yoki filtrni o&apos;zgartiring.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-white p-4">
              <div className="min-w-0">
                <Link href={`/teacher/lessons/${l.id}`} className="display-cond block truncate text-2xl hover:underline">
                  {l.title}
                </Link>
                <p className="label mt-1">
                  {l.topic.directionTitle} · {l.topic.levelCode} · {l.topic.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("label border-[3px] border-ink px-2.5 py-1.5", l.published ? "bg-acid" : "bg-paper")}>{l.published ? "Nashr qilingan" : "Qoralama"}</span>
                <Link href={`/teacher/lessons/${l.id}`} className={small}>
                  Tahrirlash
                </Link>
                <Link href={`/teacher/quiz/${l.topic.id}`} className={small}>
                  Mavzu testi
                </Link>
                <button type="button" className={small} disabled={busy === l.id} onClick={() => act(l.id, "duplicate")}>
                  Nusxa
                </button>
                {l.published ? (
                  <button type="button" className={small} disabled={busy === l.id} onClick={() => act(l.id, "unpublish")}>
                    Nashrdan olish
                  </button>
                ) : null}
                <button type="button" className={cn(small, "hover:bg-tomato")} disabled={busy === l.id} onClick={() => act(l.id, "delete")}>
                  O&apos;chirish
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pages={pages} onPage={(p) => update({ ...filters, page: p })} />
    </div>
  );
}
