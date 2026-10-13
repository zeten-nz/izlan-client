"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGetJson, apiPost, apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ConfirmDelete, Field, inputCls, primaryBtn, smallBtn } from "@/features/notebook/ui";

type Topic = { id: string; ord: number; title: string; lessons: number; publishedLessons: number; questions: number; deleteBlockers: string[] };
type Level = {
  id: string;
  ord: number;
  code: string;
  title: string;
  summary: string;
  canDo: string[];
  vocabHint: string;
  lessons: number;
  questions: number;
  learners: number;
  deleteBlockers: string[];
  topicsReorderBlocker: string | null;
  topics: Topic[];
};
type Direction = {
  id: string;
  slug: string;
  kind: "LANGUAGE" | "SUBJECT";
  title: string;
  description: string;
  active: boolean;
  learners: number;
  questions: number;
  placementReady: boolean;
  canActivate: boolean;
  deleteBlockers: string[];
  levelsReorderBlocker: string | null;
  levels: Level[];
};
type Tree = { maxLevels: number; directions: Direction[] };

const KIND = { LANGUAGE: "Til", SUBJECT: "Fan" } as const;

function Panel({ title, hint, children, action }: { title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-[3px] border-ink bg-white shadow-[6px_6px_0_0_var(--color-ink)]" aria-label={title}>
      <header className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-paper px-4 py-3">
        <h2 className="display-cond text-xl">{title}</h2>
        {action}
      </header>
      {hint ? <p className="border-b-[3px] border-ink/20 px-4 py-2 text-sm text-ink/70">{hint}</p> : null}
      <div className="p-3">{children}</div>
    </section>
  );
}

function Blocked({ children }: { children: React.ReactNode }) {
  return (
    <p role="note" className="mt-2 border-2 border-ink bg-acid/60 px-2.5 py-1.5 text-sm font-semibold">
      {children}
    </p>
  );
}

function Mover({ index, count, disabledReason, onMove, label }: { index: number; count: number; disabledReason?: string | null; onMove: (dir: -1 | 1) => void; label: string }) {
  const off = !!disabledReason;
  return (
    <span className="inline-flex gap-1">
      <button type="button" className={smallBtn} disabled={off || index === 0} onClick={() => onMove(-1)} aria-label={`${label}: yuqoriga`} title={disabledReason ?? "Yuqoriga"}>
        ↑
      </button>
      <button type="button" className={smallBtn} disabled={off || index === count - 1} onClick={() => onMove(1)} aria-label={`${label}: pastga`} title={disabledReason ?? "Pastga"}>
        ↓
      </button>
    </span>
  );
}

// ───────────── Formalar ─────────────

function DirectionForm({ initial, onSubmit, onCancel, busy }: { initial?: Direction; onSubmit: (v: { title: string; kind: "LANGUAGE" | "SUBJECT"; description: string }) => void; onCancel: () => void; busy: boolean }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState<"LANGUAGE" | "SUBJECT">(initial?.kind ?? "SUBJECT");
  const [description, setDescription] = useState(initial?.description ?? "");
  return (
    <form
      className="space-y-3 border-[3px] border-ink bg-paper p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, kind, description });
      }}
    >
      <Field label="Yo'nalish nomi *">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} autoFocus required placeholder="Masalan: Tarix" />
      </Field>
      {!initial ? (
        <Field label="Turi">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as "LANGUAGE" | "SUBJECT")}>
            <option value="SUBJECT">Fan</option>
            <option value="LANGUAGE">Til</option>
          </select>
        </Field>
      ) : null}
      <Field label="Qisqa tavsif">
        <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryBtn} disabled={busy || !title.trim()}>
          {initial ? "Saqlash" : "Yo'nalish yaratish"}
        </button>
        <button type="button" className={smallBtn} onClick={onCancel}>
          Bekor qilish
        </button>
      </div>
      {!initial ? <p className="text-sm text-ink/70">Yangi yo&apos;nalish «Tez orada» holatida yaratiladi. Daraja va mavzu qo&apos;shgach faollashtirasiz.</p> : null}
    </form>
  );
}

function LevelForm({ initial, onSubmit, onCancel, busy }: { initial?: Level; onSubmit: (v: { code: string; title: string; summary: string; canDo: string[]; vocabHint: string }) => void; onCancel: () => void; busy: boolean }) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [canDo, setCanDo] = useState((initial?.canDo ?? []).join("\n"));
  const [vocabHint, setVocabHint] = useState(initial?.vocabHint ?? "");
  return (
    <form
      className="space-y-3 border-[3px] border-ink bg-paper p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ code, title, summary, canDo: canDo.split("\n"), vocabHint });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
        <Field label="Kod *" hint="A1, 5-sinf…">
          <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} maxLength={12} autoFocus required />
        </Field>
        <Field label="Daraja nomi *">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required />
        </Field>
      </div>
      <Field label="Qisqa tavsif">
        <textarea className={inputCls} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} />
      </Field>
      <Field label="Bu darajada nimalarni qila oladi (har qatorda bittadan)">
        <textarea className={inputCls} rows={3} value={canDo} onChange={(e) => setCanDo(e.target.value)} />
      </Field>
      <Field label="Lug'at / atamalar izohi">
        <input className={inputCls} value={vocabHint} onChange={(e) => setVocabHint(e.target.value)} maxLength={200} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryBtn} disabled={busy || !code.trim() || !title.trim()}>
          {initial ? "Saqlash" : "Daraja qo'shish"}
        </button>
        <button type="button" className={smallBtn} onClick={onCancel}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

function TitleForm({ initial, label, onSubmit, onCancel, busy, submitLabel }: { initial?: string; label: string; onSubmit: (title: string) => void; onCancel: () => void; busy: boolean; submitLabel: string }) {
  const [title, setTitle] = useState(initial ?? "");
  return (
    <form
      className="space-y-3 border-[3px] border-ink bg-paper p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(title);
      }}
    >
      <Field label={label}>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} autoFocus required />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryBtn} disabled={busy || !title.trim()}>
          {submitLabel}
        </button>
        <button type="button" className={smallBtn} onClick={onCancel}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

// ───────────── Asosiy komponent ─────────────

type Editing = { kind: "dir-new" } | { kind: "dir-edit" } | { kind: "level-new" } | { kind: "level-edit" } | { kind: "topic-new" } | { kind: "topic-edit"; id: string } | null;

export function CatalogManager() {
  const [tree, setTree] = useState<Tree | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [dirId, setDirId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [blockedFor, setBlockedFor] = useState<string[] | null>(null);

  const [nonce, setNonce] = useState(0);
  const load = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await apiGetJson<Tree>("/admin/catalog");
      if (cancelled) return;
      if (!r.ok) {
        setLoadError(r.message);
        setStatus("error");
        return;
      }
      setTree(r.data);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const dir = useMemo(() => tree?.directions.find((d) => d.id === dirId) ?? tree?.directions[0] ?? null, [tree, dirId]);
  const level = useMemo(() => dir?.levels.find((l) => l.id === levelId) ?? dir?.levels[0] ?? null, [dir, levelId]);

  /** Bitta amalni bajaradi: band, xato/muvaffaqiyat xabari, so'ng daraxtni yangilaydi. */
  const run = async (fn: () => Promise<{ ok: boolean; message?: string; data?: unknown }>, success: string, after?: (data: unknown) => void) => {
    setBusy(true);
    setError("");
    setNotice("");
    setBlockedFor(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok) {
      setError(r.message ?? "Amalni bajarib bo'lmadi");
      return false;
    }
    setNotice(success);
    setEditing(null);
    load();
    after?.(r.data);
    return true;
  };

  const C = "/admin/catalog";

  if (status === "loading") return <p role="status" className="label border-[3px] border-ink bg-white p-4">Yuklanmoqda…</p>;
  if (status === "error" || !tree) {
    return (
      <div role="alert" className="border-[3px] border-ink bg-tomato p-4 font-semibold">
        {loadError || "Ma'lumotni yuklab bo'lmadi"}{" "}
        <button type="button" className={smallBtn} onClick={() => { setStatus("loading"); load(); }}>
          Qayta urinish
        </button>
      </div>
    );
  }

  const moveIds = (ids: string[], index: number, d: -1 | 1) => {
    const next = [...ids];
    [next[index], next[index + d]] = [next[index + d], next[index]];
    return next;
  };

  const askDelete = (blockers: string[], what: string, doDelete: () => void) => {
    if (blockers.length) {
      setBlockedFor([`${what} hozir o'chirib bo'lmaydi:`, ...blockers]);
      return;
    }
    doDelete();
  };

  return (
    <div className="space-y-4" data-testid="catalog">
      <div aria-live="polite">
        {notice ? <p role="status" className="border-[3px] border-ink bg-[#8df0a8] px-3 py-2 font-semibold">{notice}</p> : null}
        {error ? <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">{error}</p> : null}
        {blockedFor ? (
          <div role="alert" className="border-[3px] border-ink bg-acid px-3 py-2">
            <p className="font-bold">{blockedFor[0]}</p>
            <ul className="mt-1 list-disc pl-5 text-[15px]">{blockedFor.slice(1).map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ───── Yo'nalishlar ───── */}
        <Panel
          title="Yo'nalishlar"
          hint="Fan yoki til. Tartibi o'quvchi holatiga ta'sir qilmaydi."
          action={<button type="button" className={smallBtn} onClick={() => setEditing({ kind: "dir-new" })} data-testid="dir-add">+ Yo&apos;nalish</button>}
        >
          {editing?.kind === "dir-new" ? (
            <div className="mb-3">
              <DirectionForm busy={busy} onCancel={() => setEditing(null)} onSubmit={(v) => run(() => apiPost<{ id: string }>(`${C}/directions`, v), "Yo'nalish yaratildi ✓", (d) => setDirId((d as { id: string }).id))} />
            </div>
          ) : null}
          {tree.directions.length === 0 ? <p className="text-ink/70">Hozircha yo&apos;nalish yo&apos;q.</p> : null}
          <ul className="space-y-2">
            {tree.directions.map((d, i) => (
              <li key={d.id}>
                <div className={cn("flex items-stretch gap-2 border-[3px] border-ink", d.id === dir?.id ? "bg-acid" : "bg-white")}>
                  <button type="button" onClick={() => { setDirId(d.id); setLevelId(""); setEditing(null); }} aria-current={d.id === dir?.id} className="min-w-0 flex-1 px-3 py-2 text-left" data-testid={`dir-${d.slug}`}>
                    <span className="block truncate font-bold">{d.title}</span>
                    <span className="label block text-[10px]">
                      {KIND[d.kind]} · {d.levels.length} daraja · {d.active ? "Faol" : "Tez orada"}
                      {d.learners ? ` · ${d.learners} o'quvchi` : ""}
                    </span>
                  </button>
                  <span className="flex items-center pr-2">
                    <Mover index={i} count={tree.directions.length} label={d.title} disabledReason={busy ? "Kuting…" : null} onMove={(m) => run(() => apiPost(`${C}/directions/reorder`, { ids: moveIds(tree.directions.map((x) => x.id), i, m) }), "Tartib saqlandi ✓")} />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {dir ? (
            <div className="mt-4 space-y-3 border-t-[3px] border-ink pt-3">
              {editing?.kind === "dir-edit" ? (
                <DirectionForm initial={dir} busy={busy} onCancel={() => setEditing(null)} onSubmit={(v) => run(() => apiSend("PATCH", `${C}/directions/${dir.id}`, { title: v.title, description: v.description }), "O'zgarishlar saqlandi ✓")} />
              ) : (
                <>
                  <p className="font-bold">{dir.title}</p>
                  {dir.description ? <p className="text-sm text-ink/70">{dir.description}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={smallBtn} onClick={() => setEditing({ kind: "dir-edit" })}>Tahrirlash</button>
                    <button
                      type="button"
                      className={cn(smallBtn, dir.active ? "" : "bg-acid")}
                      disabled={busy || (!dir.active && !dir.canActivate)}
                      title={!dir.active && !dir.canActivate ? "Avval kamida bitta daraja qo'shing" : undefined}
                      onClick={() => run(() => apiSend("PATCH", `${C}/directions/${dir.id}`, { active: !dir.active }), dir.active ? "Yo'nalish «Tez orada» holatiga o'tdi" : "Yo'nalish faollashtirildi ✓")}
                      data-testid="dir-toggle"
                    >
                      {dir.active ? "Faolsizlantirish" : "Faollashtirish"}
                    </button>
                    <ConfirmDelete what="Yo'nalish" busy={busy} onConfirm={() => askDelete(dir.deleteBlockers, `«${dir.title}» yo'nalishini`, () => void run(() => apiSend("DELETE", `${C}/directions/${dir.id}`), "Yo'nalish o'chirildi", () => { setDirId(""); setLevelId(""); }))} />
                  </div>
                  {!dir.canActivate && !dir.active ? <Blocked>Faollashtirish uchun avval kamida bitta daraja qo&apos;shing.</Blocked> : null}
                  {dir.active && !dir.placementReady ? (
                    <Blocked>Bu yo&apos;nalishda daraja aniqlash testi savollari yo&apos;q: o&apos;quvchilar faqat «0 dan boshlash» ni tanlay oladi.</Blocked>
                  ) : null}
                  {dir.deleteBlockers.length ? <p className="text-sm text-ink/60">O&apos;chirish: {dir.deleteBlockers[0]}</p> : null}
                </>
              )}
            </div>
          ) : null}
        </Panel>

        {/* ───── Darajalar ───── */}
        <Panel
          title="Darajalar"
          hint={dir ? `${dir.title}: ${dir.levels.length} / ${tree.maxLevels}` : "Yo'nalish tanlang"}
          action={
            dir ? (
              <button type="button" className={smallBtn} disabled={dir.levels.length >= tree.maxLevels} title={dir.levels.length >= tree.maxLevels ? `Hozircha ${tree.maxLevels} tadan ortiq daraja bo'lmaydi` : undefined} onClick={() => setEditing({ kind: "level-new" })} data-testid="level-add">
                + Daraja
              </button>
            ) : null
          }
        >
          {!dir ? <p className="text-ink/70">Avval yo&apos;nalishni tanlang yoki yarating.</p> : null}
          {dir && editing?.kind === "level-new" ? (
            <div className="mb-3">
              <LevelForm busy={busy} onCancel={() => setEditing(null)} onSubmit={(v) => run(() => apiPost<{ id: string }>(`${C}/directions/${dir.id}/levels`, v), "Daraja qo'shildi ✓ (oxiriga)", (d) => setLevelId((d as { id: string }).id))} />
            </div>
          ) : null}
          {dir && dir.levels.length === 0 && editing?.kind !== "level-new" ? <p className="text-ink/70">Bu yo&apos;nalishda daraja yo&apos;q. «+ Daraja» bilan qo&apos;shing.</p> : null}
          {dir && dir.levelsReorderBlocker && dir.levels.length > 1 ? <Blocked>Tartiblash o&apos;chirilgan: {dir.levelsReorderBlocker}</Blocked> : null}
          <ul className="mt-2 space-y-2">
            {dir?.levels.map((l, i) => (
              <li key={l.id}>
                <div className={cn("flex items-stretch gap-2 border-[3px] border-ink", l.id === level?.id ? "bg-acid" : "bg-white")}>
                  <button type="button" onClick={() => { setLevelId(l.id); setEditing(null); }} aria-current={l.id === level?.id} className="min-w-0 flex-1 px-3 py-2 text-left" data-testid={`level-${l.code}`}>
                    <span className="block truncate font-bold">{l.ord}. {l.code} · {l.title}</span>
                    <span className="label block text-[10px]">{l.topics.length} mavzu · {l.lessons} dars</span>
                  </button>
                  <span className="flex items-center pr-2">
                    <Mover index={i} count={dir.levels.length} label={l.code} disabledReason={busy ? "Kuting…" : dir.levelsReorderBlocker} onMove={(m) => run(() => apiPost(`${C}/directions/${dir.id}/levels/reorder`, { ids: moveIds(dir.levels.map((x) => x.id), i, m) }), "Darajalar tartibi saqlandi ✓")} />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {dir && level ? (
            <div className="mt-4 space-y-3 border-t-[3px] border-ink pt-3">
              {editing?.kind === "level-edit" ? (
                <LevelForm initial={level} busy={busy} onCancel={() => setEditing(null)} onSubmit={(v) => run(() => apiSend("PATCH", `${C}/levels/${level.id}`, v), "O'zgarishlar saqlandi ✓")} />
              ) : (
                <>
                  <p className="font-bold">{level.code} · {level.title}</p>
                  {level.summary ? <p className="text-sm text-ink/70">{level.summary}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={smallBtn} onClick={() => setEditing({ kind: "level-edit" })}>Tahrirlash</button>
                    <ConfirmDelete what="Daraja" busy={busy} onConfirm={() => askDelete(level.deleteBlockers, `«${level.code}» darajasini`, () => void run(() => apiSend("DELETE", `${C}/levels/${level.id}`), "Daraja o'chirildi", () => setLevelId("")))} />
                  </div>
                  {level.deleteBlockers.length ? <p className="text-sm text-ink/60">O&apos;chirish: {level.deleteBlockers[0]}</p> : null}
                </>
              )}
            </div>
          ) : null}
        </Panel>

        {/* ───── Mavzular ───── */}
        <Panel
          title="Mavzular"
          hint={level ? `${level.code} · ${level.title}` : "Daraja tanlang"}
          action={level ? <button type="button" className={smallBtn} onClick={() => setEditing({ kind: "topic-new" })} data-testid="topic-add">+ Mavzu</button> : null}
        >
          {!level ? <p className="text-ink/70">Avval darajani tanlang yoki qo&apos;shing.</p> : null}
          {level && editing?.kind === "topic-new" ? (
            <div className="mb-3">
              <TitleForm label="Mavzu nomi *" submitLabel="Mavzu qo'shish" busy={busy} onCancel={() => setEditing(null)} onSubmit={(t) => run(() => apiPost(`${C}/levels/${level.id}/topics`, { title: t }), "Mavzu qo'shildi ✓ (oxiriga)")} />
            </div>
          ) : null}
          {level && level.topics.length === 0 && editing?.kind !== "topic-new" ? <p className="text-ink/70">Bu darajada mavzu yo&apos;q.</p> : null}
          {level && level.topicsReorderBlocker && level.topics.length > 1 ? <Blocked>Tartiblash o&apos;chirilgan: {level.topicsReorderBlocker}</Blocked> : null}
          <ol className="mt-2 space-y-2">
            {level?.topics.map((t, i) => (
              <li key={t.id}>
                {editing?.kind === "topic-edit" && editing.id === t.id ? (
                  <TitleForm initial={t.title} label="Mavzu nomi *" submitLabel="Saqlash" busy={busy} onCancel={() => setEditing(null)} onSubmit={(title) => run(() => apiSend("PATCH", `${C}/topics/${t.id}`, { title }), "O'zgarishlar saqlandi ✓")} />
                ) : (
                  <div className="border-[3px] border-ink bg-white p-2.5">
                    <div className="flex items-start gap-2">
                      <span className="grid size-7 shrink-0 place-items-center border-2 border-ink/60 font-mono text-xs font-bold">{t.ord}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-tight">{t.title}</p>
                        <p className="label mt-0.5 text-[10px]">
                          {t.lessons} dars{t.publishedLessons !== t.lessons ? ` (${t.publishedLessons} nashr)` : ""}
                          {t.questions ? ` · ${t.questions} savol` : ""}
                        </p>
                      </div>
                      <Mover index={i} count={level.topics.length} label={t.title} disabledReason={busy ? "Kuting…" : level.topicsReorderBlocker} onMove={(m) => run(() => apiPost(`${C}/levels/${level.id}/topics/reorder`, { ids: moveIds(level.topics.map((x) => x.id), i, m) }), "Mavzular tartibi saqlandi ✓")} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" className={smallBtn} onClick={() => setEditing({ kind: "topic-edit", id: t.id })}>Tahrirlash</button>
                      <ConfirmDelete what="Mavzu" busy={busy} onConfirm={() => askDelete(t.deleteBlockers, `«${t.title}» mavzusini`, () => void run(() => apiSend("DELETE", `${C}/topics/${t.id}`), "Mavzu o'chirildi"))} />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
