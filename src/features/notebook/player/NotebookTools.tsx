"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { apiGetJson, apiPost, apiSend, type FieldErrors } from "@/lib/api";
import { cn } from "@/lib/cn";
import { sentenceAround } from "../text";
import { Field, inputCls, primaryBtn, smallBtn } from "../ui";

type Page = { id: string; title: string };
type Sheet = { kind: "vocab"; term: string; example: string; page: Page } | { kind: "note"; page: Page } | null;
type Saved = { lesson: string | null; pages: Record<string, string> };

const draftKey = (lessonId: string) => `izlan:nb-draft:note:${lessonId}`;

function readDraft(lessonId: string): { title: string; body: string } | null {
  try {
    const raw = localStorage.getItem(draftKey(lessonId));
    if (!raw) return null;
    const d = JSON.parse(raw) as { title?: string; body?: string };
    return typeof d.body === "string" && d.body.trim() ? { title: d.title ?? "", body: d.body } : null;
  } catch {
    return null;
  }
}
function writeDraft(lessonId: string, d: { title: string; body: string } | null) {
  try {
    if (!d || !d.body.trim()) localStorage.removeItem(draftKey(lessonId));
    else localStorage.setItem(draftKey(lessonId), JSON.stringify(d));
  } catch {
    /* brauzer saqlashni bloklagan bo'lsa ham eslatma serverga saqlanadi */
  }
}

/** Joylashuvi sahifa/zoom'ga bog'liq emas: sheet va panel `position: fixed`, koordinata hisoblanmaydi. */
function SheetFrame({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-label={label}
      data-testid="nb-sheet"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto border-[3px] border-b-0 border-ink bg-paper p-4 shadow-[0_-6px_0_0_var(--color-ink)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[420px] sm:border-b-[3px] sm:shadow-[6px_6px_0_0_var(--color-ink)]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="display-cond text-xl">{label}</p>
        <button type="button" onClick={onClose} aria-label="Yopish" className={smallBtn}>
          Yopish ✕
        </button>
      </div>
      {children}
    </div>
  );
}

function VocabSheet({ lessonId, sheet, onClose, onDone }: { lessonId: string; sheet: Extract<NonNullable<Sheet>, { kind: "vocab" }>; onClose: () => void; onDone: (msg: string) => void }) {
  const [term, setTerm] = useState(sheet.term);
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState(sheet.example);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [dup, setDup] = useState(false);

  const submit = async (force: boolean) => {
    setBusy(true);
    setErrors({});
    setError("");
    const r = await apiPost<{ created: boolean }>("/notebook/vocabulary", {
      term,
      meaning,
      example,
      note,
      lessonId,
      pageId: sheet.page.id,
      ...(force ? { force: true } : {}),
    });
    setBusy(false);
    if (r.ok) onDone(r.data.created ? `«${term.trim()}» lug'atga qo'shildi ✓` : `«${term.trim()}» lug'atda allaqachon bor ✓`);
    else if (r.status === 409) {
      setDup(true);
      setError(r.message);
    } else {
      setErrors(r.fieldErrors);
      setError(r.message);
    }
  };

  return (
    <SheetFrame label="Lug'atga qo'shish" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        <Field label="So'z yoki atama *" error={errors.term}>
          <input value={term} onChange={(e) => setTerm(e.target.value)} className={inputCls} maxLength={120} required />
        </Field>
        <Field label="Tarjima yoki izoh" error={errors.meaning}>
          <input value={meaning} onChange={(e) => setMeaning(e.target.value)} className={inputCls} maxLength={300} autoFocus placeholder="Masalan: allaqachon" />
        </Field>
        <Field label="Misol gap" error={errors.example}>
          <input value={example} onChange={(e) => setExample(e.target.value)} className={inputCls} maxLength={400} />
        </Field>
        <details>
          <summary className="cursor-pointer text-sm font-bold underline">Qo&apos;shimcha izoh</summary>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className={cn(inputCls, "mt-2")} rows={2} maxLength={600} aria-label="Qo'shimcha izoh" />
        </details>
        <p className="text-sm text-ink/70">Manba: {sheet.page.title || "joriy sahifa"} (avtomatik qo&apos;shiladi)</p>
        {error ? (
          <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {dup ? (
            <button type="button" disabled={busy} onClick={() => void submit(true)} className={primaryBtn}>
              Boshqa ma&apos;noda qo&apos;shish
            </button>
          ) : (
            <button type="submit" disabled={busy || !term.trim()} className={primaryBtn}>
              {busy ? "Saqlanmoqda…" : "Lug'atga qo'shish"}
            </button>
          )}
          <button type="button" onClick={onClose} className={smallBtn}>
            Bekor qilish
          </button>
        </div>
      </form>
    </SheetFrame>
  );
}

function NoteSheet({ lessonId, page, onClose, onDone }: { lessonId: string; page: Page; onClose: () => void; onDone: (msg: string) => void }) {
  // Qoralama brauzer xotirasida: panel tasodifan yopilsa ham matn yo'qolmaydi
  const [draft] = useState(() => readDraft(lessonId));
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    writeDraft(lessonId, { title, body });
  }, [lessonId, title, body]);

  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await apiPost("/notebook/notes", { title, body, lessonId, pageId: page.id });
    setBusy(false);
    if (r.ok) {
      writeDraft(lessonId, null);
      onDone("Eslatma saqlandi ✓");
    } else setError(r.message); // matn saqlanib qoladi: qayta urinish mumkin
  };

  return (
    <SheetFrame label="Eslatma qo'shish" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {draft ? <p className="border-2 border-ink bg-sky px-2 py-1 text-sm font-semibold">Saqlanmagan qoralamangiz tiklandi.</p> : null}
        <Field label="Sarlavha (ixtiyoriy)">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} maxLength={120} />
        </Field>
        <Field label="Eslatma *">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} rows={6} maxLength={5000} autoFocus required />
        </Field>
        <p className="text-sm text-ink/70">Sahifa: {page.title || "joriy sahifa"}. Saqlagach shu darsda qolasiz.</p>
        {error ? (
          <p role="alert" className="border-[3px] border-ink bg-tomato px-3 py-2 font-semibold">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy || !body.trim()} className={primaryBtn}>
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </button>
          <button type="button" onClick={onClose} className={smallBtn}>
            Yopish (qoralama saqlanadi)
          </button>
        </div>
      </form>
    </SheetFrame>
  );
}

/**
 * Dars ichidagi Daftar vositalari: matn belgilash → Lug'atga qo'shish, Eslatma, Saqlash.
 * Dars holati (sahifa, javoblar) o'zgarmaydi: bu komponent player holatiga tegmaydi.
 */
export function NotebookTools({ lessonId, page }: { lessonId: string; page: Page }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [savedError, setSavedError] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selection, setSelection] = useState<{ text: string; sentence: string } | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const holding = useRef(false);

  useEffect(() => {
    let alive = true;
    void apiGetJson<Saved>(`/notebook/saved/status?lessonId=${lessonId}`).then((r) => {
      if (!alive) return;
      if (r.ok) setSaved(r.data);
      else setSavedError(true);
    });
    return () => {
      alive = false;
    };
  }, [lessonId]);

  // Matn belgilash: faqat sarlavha/matn/callout bloklari ichida (savol va javob maydonlari emas)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const textOf = (n: Node | null) => ((n?.nodeType === 1 ? (n as Element) : n?.parentElement) ?? null)?.closest<HTMLElement>("[data-notebook-text]") ?? null;
    const onChange = () => {
      clearTimeout(timer);
      const s = window.getSelection();
      let next: { text: string; sentence: string } | null = null;
      if (s && s.rangeCount > 0 && !s.isCollapsed) {
        const range = s.getRangeAt(0);
        const a = textOf(range.startContainer);
        const b = textOf(range.endContainer);
        const text = s.toString().replace(/\s+/g, " ").trim();
        if (a && a === b && text && text.length <= 120) next = { text, sentence: sentenceAround(a.textContent ?? "", text) };
      }
      if (next) setSelection(next);
      else timer = setTimeout(() => !holding.current && setSelection(null), 250);
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      clearTimeout(timer);
    };
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);
  const done = (msg: string) => {
    setSheet(null);
    setToast(msg);
  };

  const toggle = async (pageId?: string) => {
    if (!saved || busy) return;
    const existing = pageId ? saved.pages[pageId] : saved.lesson;
    setBusy(true);
    setToast("");
    if (existing) {
      const r = await apiSend("DELETE", `/notebook/saved/${existing}`);
      if (r.ok) {
        setSaved(pageId ? { ...saved, pages: Object.fromEntries(Object.entries(saved.pages).filter(([k]) => k !== pageId)) } : { ...saved, lesson: null });
        setToast(pageId ? "Sahifa saqlanganlardan olib tashlandi" : "Dars saqlanganlardan olib tashlandi");
      } else setToast(r.message);
    } else {
      const r = await apiPost<{ saved: { id: string } }>("/notebook/saved", { lessonId, ...(pageId ? { pageId } : {}) });
      if (r.ok) {
        setSaved(pageId ? { ...saved, pages: { ...saved.pages, [pageId]: r.data.saved.id } } : { ...saved, lesson: r.data.saved.id });
        setToast(pageId ? "Sahifa saqlandi ✓" : "Dars saqlandi ✓");
      } else setToast(r.message);
    }
    setBusy(false);
  };

  const lessonSaved = !!saved?.lesson;
  const pageSaved = !!saved?.pages[page.id];

  return (
    <div className="mt-3" data-testid="nb-tools">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSheet({ kind: "note", page })} className={smallBtn} data-testid="nb-note-btn">
          ＋ Eslatma
        </button>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={!saved || busy}
          aria-pressed={lessonSaved}
          className={cn(smallBtn, lessonSaved && "bg-acid")}
          data-testid="nb-save-lesson"
          title={savedError ? "Saqlash holatini yuklab bo'lmadi" : undefined}
        >
          {lessonSaved ? "★ Dars saqlangan" : "☆ Darsni saqlash"}
        </button>
        <button
          type="button"
          onClick={() => void toggle(page.id)}
          disabled={!saved || busy}
          aria-pressed={pageSaved}
          className={cn(smallBtn, pageSaved && "bg-acid")}
          data-testid="nb-save-page"
        >
          {pageSaved ? "★ Sahifa saqlangan" : "☆ Sahifani saqlash"}
        </button>
        <Link href={`${ROUTES.student}/notebook`} className="ml-auto text-sm font-bold underline decoration-2 underline-offset-4 hover:bg-acid" target="_blank" rel="noreferrer">
          Daftarni ochish ↗
        </Link>
      </div>
      <p className="mt-1.5 text-sm text-ink/60">Tushunmagan so&apos;z yoki iborangizni matndan belgilang — lug&apos;atga qo&apos;shish tugmasi chiqadi.</p>
      <div aria-live="polite" className="min-h-0">
        {toast ? (
          <p role="status" className="mt-2 inline-block border-[3px] border-ink bg-[#8df0a8] px-3 py-1.5 text-[15px] font-semibold" data-testid="nb-toast">
            {toast}
          </p>
        ) : null}
      </div>

      {selection && !sheet ? (
        <div
          role="toolbar"
          aria-label="Tanlangan matn"
          data-testid="nb-selection-bar"
          onPointerDownCapture={() => {
            holding.current = true;
          }}
          onPointerUp={() => setTimeout(() => (holding.current = false), 400)}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[460px] items-center gap-3 border-[3px] border-ink bg-ink p-2.5 pl-4 text-paper shadow-[5px_5px_0_0_var(--color-acid)]"
        >
          <span className="min-w-0 flex-1 truncate font-semibold">«{selection.text}»</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSheet({ kind: "vocab", term: selection.text, example: selection.sentence, page });
              setSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="shrink-0 border-[3px] border-paper bg-acid px-3 py-1.5 font-display text-[13px] font-black uppercase text-ink hover:bg-white"
          >
            Lug&apos;atga qo&apos;shish
          </button>
        </div>
      ) : null}

      {sheet?.kind === "vocab" ? <VocabSheet key={`${sheet.term}|${sheet.page.id}`} lessonId={lessonId} sheet={sheet} onClose={closeSheet} onDone={done} /> : null}
      {sheet?.kind === "note" ? <NoteSheet lessonId={lessonId} page={sheet.page} onClose={closeSheet} onDone={done} /> : null}
    </div>
  );
}
