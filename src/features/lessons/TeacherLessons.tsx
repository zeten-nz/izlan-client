"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { apiPost, apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";

export type CatalogDirection = { id: string; title: string; levels: { id: string; code: string; title: string; topics: { id: string; ord: number; title: string }[] }[] };
export type LessonRow = {
  id: string;
  title: string;
  updatedAt: string;
  published: { rev: number; at: string } | null;
  topic: { id: string; title: string; levelCode: string; directionTitle: string };
};

const sel = "w-full border-[3px] border-ink bg-white px-3 py-2 font-medium outline-none focus:bg-acid/40";
const small = "border-[3px] border-ink bg-white px-3 py-1.5 text-sm font-bold hover:bg-acid disabled:opacity-40";

export function TeacherLessons({ lessons, directions }: { lessons: LessonRow[]; directions: CatalogDirection[] }) {
  const router = useRouter();
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

      {lessons.length === 0 ? (
        <p className="mt-8 border-[3px] border-dashed border-ink bg-white p-6 text-lg">Hali dars yo&apos;q. Yuqorida mavzuni tanlab, birinchi darsni yarating.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {lessons.map((l) => (
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
    </div>
  );
}
