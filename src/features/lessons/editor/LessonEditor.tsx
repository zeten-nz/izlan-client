"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { apiSend } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Block, BlockType, LessonDoc, Page } from "../types";
import { Canvas } from "./Canvas";
import { historyReducer, initHistory } from "./history";
import { Inspector, type Update } from "./Inspector";
import { duplicateBlock, duplicatePage, fitBlock, mapBlock, mapPage, newBlock, newPage, removeBlock, reorderZ } from "./ops";
import { PageList } from "./PageList";
import { PreviewRunner } from "./PreviewRunner";

export type EditorInitial = {
  id: string;
  title: string;
  draft: { rev: number; doc: LessonDoc };
  published: { rev: number; at: string } | null;
};

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
type Issue = { path: string; message: string };

const PALETTE: { type: BlockType; label: string; icon: string }[] = [
  { type: "heading", label: "Sarlavha", icon: "H" },
  { type: "text", label: "Matn", icon: "¶" },
  { type: "callout", label: "Muhim", icon: "!" },
  { type: "image", label: "Rasm", icon: "▣" },
  { type: "audio", label: "Audio", icon: "♪" },
  { type: "choice", label: "Test", icon: "◉" },
  { type: "fillblank", label: "Bo'sh joy", icon: "_" },
];

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "Saqlandi ✓",
  dirty: "O'zgarishlar bor…",
  saving: "Saqlanmoqda…",
  error: "Saqlanmadi!",
  conflict: "Boshqa joyda o'zgargan",
};

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

function useMinWidth(px: number) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const f = () => setOk(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [px]);
  return ok;
}

export function LessonEditor({ initial }: { initial: EditorInitial }) {
  const wideEnough = useMinWidth(768);
  const isLg = useMinWidth(1100);

  const [hist, dispatch] = useReducer(historyReducer, initial.draft.doc, initHistory);
  const doc = hist.doc;
  const [title, setTitle] = useState(initial.title);
  const [pageId, setPageId] = useState(initial.draft.doc.pages[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [save, setSave] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [published, setPublished] = useState(initial.published);
  const [dirtySincePublish, setDirtySincePublish] = useState(!initial.published || initial.published.rev !== initial.draft.rev);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [publishing, setPublishing] = useState(false);

  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0];
  const block = page.blocks.find((b) => b.id === selectedId) ?? null;

  // ───────────── Tahrirlar ─────────────
  const commit = useCallback((next: LessonDoc, key?: string) => dispatch({ type: "commit", doc: next, key, now: Date.now() }), []);
  const updateBlock: Update = (f, key) => {
    if (!block) return;
    commit(mapBlock(doc, page.id, block.id, f), key);
  };
  const updatePage = (f: (p: Page) => Page, key?: string) => commit(mapPage(doc, page.id, f), key);

  const addBlock = (type: BlockType) => {
    const b = newBlock(type, page.blocks);
    commit(mapPage(doc, page.id, (p) => ({ ...p, blocks: [...p.blocks, b] })));
    setSelectedId(b.id);
    setFocusToken((n) => n + 1);
  };
  const deleteBlock = () => {
    if (!block) return;
    commit(removeBlock(doc, page.id, block.id));
    setSelectedId(null);
  };
  const dupBlock = () => {
    if (!block) return;
    const r = duplicateBlock(doc, page.id, block.id);
    commit(r.doc);
    setSelectedId(r.id);
  };
  const setFrame = (id: string, r: { x: number; y: number; w: number; h: number }) => commit(mapBlock(doc, page.id, id, (b) => fitBlock({ ...b, ...r }) as Block));

  const addPage = () => {
    const p = newPage();
    const i = doc.pages.findIndex((x) => x.id === page.id);
    commit({ ...doc, pages: [...doc.pages.slice(0, i + 1), p, ...doc.pages.slice(i + 1)] });
    setPageId(p.id);
    setSelectedId(null);
  };
  const dupPage = (id: string) => {
    const r = duplicatePage(doc, id);
    commit(r.doc);
    if (r.id) setPageId(r.id);
    setSelectedId(null);
  };
  const delPage = (id: string) => {
    if (doc.pages.length <= 1) return;
    const p = doc.pages.find((x) => x.id === id);
    if (p && p.blocks.length > 0 && !window.confirm(`Bu sahifada ${p.blocks.length} ta element bor. O'chirilsinmi? (Ctrl+Z bilan qaytarish mumkin)`)) return;
    const i = doc.pages.findIndex((x) => x.id === id);
    const next = doc.pages.filter((x) => x.id !== id);
    commit({ ...doc, pages: next });
    if (id === pageId) setPageId(next[Math.min(i, next.length - 1)].id);
    setSelectedId(null);
  };

  // ───────────── Avtosaqlash ─────────────
  const docRef = useRef(doc);
  const titleRef = useRef(title);
  useEffect(() => {
    docRef.current = doc;
    titleRef.current = title;
  });
  const revRef = useRef(initial.draft.rev);
  const savedDoc = useRef(initial.draft.doc);
  const savedTitle = useRef(initial.title);
  const inflight = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflict = useRef(false);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    for (let i = 0; i < 5; i++) {
      if (conflict.current) return false;
      if (inflight.current) {
        await inflight.current;
        continue;
      }
      const d = docRef.current;
      const t = titleRef.current;
      if (d === savedDoc.current && t === savedTitle.current) return true;
      setSave("saving");
      const run = (async () => {
        const r = await apiSend<{ rev: number }>("PUT", `/staff/lessons/${initial.id}/draft`, { rev: revRef.current, title: t.trim() || undefined, doc: d });
        if (r.ok) {
          revRef.current = r.data.rev;
          savedDoc.current = d;
          savedTitle.current = t;
          setSaveError(null);
        } else if (r.status === 409) {
          conflict.current = true;
          setSave("conflict");
        } else {
          setSaveError(r.message);
          setSave("error");
          throw new Error(r.message);
        }
      })();
      inflight.current = run.catch(() => undefined).finally(() => (inflight.current = null));
      try {
        await run;
      } catch {
        return false;
      }
    }
    const clean = docRef.current === savedDoc.current && titleRef.current === savedTitle.current;
    if (clean) setSave("saved");
    return clean;
  }, [initial.id]);

  useEffect(() => {
    if (doc === savedDoc.current && title === savedTitle.current) return;
    setDirtySincePublish(true);
    if (conflict.current) return;
    setSave("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush().then((ok) => ok && setSave("saved")), 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [doc, title, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (docRef.current !== savedDoc.current || titleRef.current !== savedTitle.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // ───────────── Nashr ─────────────
  const publish = async () => {
    setPublishing(true);
    setIssues(null);
    const ok = await flush();
    if (!ok) {
      setPublishing(false);
      return;
    }
    try {
      const res = await fetch(`/api/staff/lessons/${initial.id}/publish`, { method: "POST" });
      const json = (await res.json().catch(() => null)) as { issues?: Issue[]; message?: string; rev?: number } | null;
      if (res.ok) {
        setPublished({ rev: json?.rev ?? revRef.current, at: new Date().toISOString() });
        setDirtySincePublish(false);
      } else {
        setIssues(json?.issues?.length ? json.issues : [{ path: "", message: json?.message ?? "Nashr qilib bo'lmadi" }]);
      }
    } catch {
      setIssues([{ path: "", message: "Server bilan aloqa yo'q" }]);
    }
    setPublishing(false);
  };

  const jumpTo = (path: string) => {
    const m = /^pages\.(\d+)(?:\.blocks\.(\d+))?/.exec(path);
    if (!m) return;
    const p = doc.pages[Number(m[1])];
    if (!p) return;
    setMode("edit");
    setPageId(p.id);
    setSelectedId(m[2] !== undefined ? (p.blocks[Number(m[2])]?.id ?? null) : null);
  };

  // ───────────── Klaviatura ─────────────
  useEffect(() => {
    if (mode !== "edit") return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      } else if (mod && key === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      } else if (mod && key === "d" && block) {
        e.preventDefault();
        dupBlock();
      } else if ((key === "delete" || key === "backspace") && block) {
        e.preventDefault();
        deleteBlock();
      } else if (key === "escape") {
        setSelectedId(null);
      } else if (block && key.startsWith("arrow")) {
        e.preventDefault();
        const s = e.shiftKey ? 10 : 1;
        const dx = key === "arrowleft" ? -s : key === "arrowright" ? s : 0;
        const dy = key === "arrowup" ? -s : key === "arrowdown" ? s : 0;
        commit(mapBlock(doc, page.id, block.id, (b) => fitBlock({ ...b, x: b.x + dx, y: b.y + dy })), `nudge:${block.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reorderPages = useCallback((pages: Page[]) => commit({ ...doc, pages }), [commit, doc]);

  const statusTone = useMemo(() => (save === "error" || save === "conflict" ? "bg-tomato" : save === "saved" ? "bg-acid" : "bg-white"), [save]);

  if (wideEnough === null) return <div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>;
  if (!wideEnough) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="border-[3px] border-ink bg-acid p-6 shadow-[8px_8px_0_0_var(--color-ink)]">
          <p className="display-cond text-3xl">Kompyuter yoki planshet kerak</p>
          <p className="mt-3 text-lg leading-snug">
            Dars yaratish keng ekranda qulay va aniq bo&apos;ladi. Iltimos, kompyuterdan yoki planshetdan (yotiq holatda) kiring. Telefonda darslarni faqat o&apos;tish mumkin.
          </p>
          <Link href="/teacher/lessons" className={cn(buttonClasses("ink"), "mt-5")}>
            ← Darslarim
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-68px)] flex-col">
      {/* Yuqori panel */}
      <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-ink bg-white px-4 py-2.5">
        <Link href="/teacher/lessons" className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
          ← Darslarim
        </Link>
        <input
          aria-label="Dars nomi"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-48 flex-1 border-[3px] border-ink bg-paper px-3 py-1.5 font-display text-lg font-black outline-none focus:bg-acid/40"
        />
        <span role="status" className={cn("label border-[3px] border-ink px-2.5 py-1.5", statusTone)}>
          {SAVE_LABEL[save]}
        </span>
        <div className="flex gap-1.5">
          <button type="button" className="border-[3px] border-ink bg-paper px-3 py-1.5 font-bold hover:bg-acid disabled:opacity-30" disabled={!hist.past.length || mode !== "edit"} onClick={() => dispatch({ type: "undo" })} title="Qaytarish (Ctrl+Z)">
            ↶
          </button>
          <button type="button" className="border-[3px] border-ink bg-paper px-3 py-1.5 font-bold hover:bg-acid disabled:opacity-30" disabled={!hist.future.length || mode !== "edit"} onClick={() => dispatch({ type: "redo" })} title="Qayta bajarish (Ctrl+Shift+Z)">
            ↷
          </button>
        </div>
        <button
          type="button"
          className={cn(buttonClasses("paper"), "px-4 py-2")}
          onClick={async () => {
            if (mode === "edit") {
              await flush();
              setPreviewVersion((v) => v + 1);
              setMode("preview");
            } else setMode("edit");
          }}
        >
          {mode === "edit" ? "Ko'rib chiqish" : "Tahrirlash"}
        </button>
        <button type="button" disabled={publishing || save === "conflict"} onClick={publish} className={cn(buttonClasses("acid"), "px-4 py-2 disabled:opacity-50")}>
          {publishing ? "…" : published && !dirtySincePublish ? "Nashr qilingan ✓" : "Nashr qilish"}
        </button>
      </div>

      {save === "conflict" ? (
        <div role="alert" className="border-b-[3px] border-ink bg-tomato px-4 py-3 font-semibold">
          Bu dars boshqa oynada o&apos;zgartirilgan. Yangi o&apos;zgarishlarni yo&apos;qotmaslik uchun saqlash to&apos;xtatildi.{" "}
          <button type="button" className="underline" onClick={() => window.location.reload()}>
            Sahifani yangilash
          </button>
        </div>
      ) : null}
      {save === "error" && saveError ? (
        <div role="alert" className="border-b-[3px] border-ink bg-tomato px-4 py-3 font-semibold">
          {saveError}{" "}
          <button type="button" className="underline" onClick={() => void flush()}>
            Qayta urinish
          </button>
        </div>
      ) : null}
      {issues ? (
        <div role="alert" className="border-b-[3px] border-ink bg-tomato/80 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display font-black uppercase">Nashr qilishdan oldin tuzating:</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                {issues.map((it, i) => (
                  <li key={i}>
                    {it.path ? (
                      <button type="button" className="text-left font-semibold underline" onClick={() => jumpTo(it.path)}>
                        {it.message}
                      </button>
                    ) : (
                      it.message
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" aria-label="Yopish" className="border-[3px] border-ink bg-white px-2 font-bold" onClick={() => setIssues(null)}>
              ✕
            </button>
          </div>
        </div>
      ) : null}
      {published && !dirtySincePublish && mode === "edit" && !issues ? (
        <div className="border-b-[3px] border-ink bg-acid px-4 py-1.5 text-sm font-semibold">Dars nashr qilindi — o&apos;quvchilar ko&apos;ra oladi.</div>
      ) : null}

      {mode === "preview" ? (
        <div className="flex-1 bg-paper">
          <PreviewRunner lessonId={initial.id} title={title} version={previewVersion} onBack={() => setMode("edit")} />
        </div>
      ) : (
        <div className={cn("flex-1", isLg ? "grid grid-cols-[230px_minmax(0,1fr)_330px]" : "flex flex-col")}>
          {/* Chap: elementlar + sahifalar */}
          <aside className={cn("border-ink bg-paper-2 p-3", isLg ? "h-[calc(100dvh-68px-64px)] overflow-y-auto border-r-[3px]" : "border-b-[3px]")}>
            <p className="label mb-2">Elementlar</p>
            <div className={cn("grid gap-2", isLg ? "grid-cols-2" : "grid-cols-4 sm:grid-cols-7")}>
              {PALETTE.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => addBlock(p.type)}
                  className="border-[3px] border-ink bg-white px-1 py-2 text-center text-[13px] font-bold shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-acid active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <span className="block font-display text-xl leading-none">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="label mb-2 mt-5">Sahifalar ({doc.pages.length})</p>
            <PageList
              pages={doc.pages}
              currentId={page.id}
              horizontal={!isLg}
              onSelect={(id) => {
                setPageId(id);
                setSelectedId(null);
              }}
              onAdd={addPage}
              onDuplicate={dupPage}
              onDelete={delPage}
              onReorder={reorderPages}
            />
          </aside>

          {/* Markaz: kanvas */}
          <section className={cn("min-w-0 p-4", isLg && "h-[calc(100dvh-68px-64px)] overflow-y-auto")}>
            <p className="label mb-2">
              {doc.pages.findIndex((p) => p.id === page.id) + 1}-sahifa
              {page.gate !== "free" ? " · o'tish sharti bor 🔒" : ""}
            </p>
            <Canvas
              page={page}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onFrame={setFrame}
              onOpenText={(id) => {
                setSelectedId(id);
                setFocusToken((n) => n + 1);
              }}
            />
            <p className="mt-3 text-xs opacity-70">
              Torting — surish · burchakdan torting — o&apos;lcham · Alt — yopishishsiz · strelkalar — 1px (Shift: 10px) · Ctrl+Z — qaytarish
            </p>
          </section>

          {/* O'ng: sozlamalar */}
          <aside className={cn("border-ink bg-paper p-4", isLg ? "h-[calc(100dvh-68px-64px)] overflow-y-auto border-l-[3px]" : "border-t-[3px]")}>
            <Inspector
              page={page}
              block={block}
              onUpdate={updateBlock}
              onPage={updatePage}
              onDelete={deleteBlock}
              onDuplicate={dupBlock}
              onZ={(dir) => block && commit(reorderZ(doc, page.id, block.id, dir))}
              focusToken={focusToken}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
