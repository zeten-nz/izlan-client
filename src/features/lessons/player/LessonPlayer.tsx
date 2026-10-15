"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { NotebookTools } from "@/features/notebook/player/NotebookTools";
import { XpResult } from "@/features/profile/xp";
import type { XpAward } from "@/features/profile/types";
import { PageView } from "../PageView";
import type { AnswerResult, PlayerView } from "../types";

export type PlayerAdapter = {
  answer(blockId: string, payload: Record<string, unknown>): Promise<{ result: AnswerResult; view?: PlayerView } | null>;
  complete(): Promise<{ ok: boolean; firstTime?: boolean; xp?: XpAward | null }>;
  /** Sahifa ochib ko'rildi (faqat o'quvchi rejimida; preview'da yo'q). */
  visit?(pageId: string): Promise<boolean>;
};

type Props = {
  initial: PlayerView;
  adapter: PlayerAdapter;
  /** "Mavzuga qaytish" havolasi */
  backHref: string;
  /** Preview rejimi: ustoz uchun belgi */
  preview?: boolean;
  /** Berilsa, "orqaga" havola emas, tugma bo'ladi (muharrir ichidagi preview) */
  onBack?: () => void;
  /** Daftar vositalari (eslatma, saqlash, lug'at). Faqat o'quvchi rejimida. */
  notebook?: boolean;
  /** `?page=` orqali kelgan sahifa (Saqlanganlar/Daftardan qaytish). Faqat ochiq sahifalar ichida. */
  startPageId?: string;
};

const GATE_HINT = {
  answered: "Davom etish uchun savol(lar)ga javob bering",
  correct: "Davom etish uchun savol(lar)ga to'g'ri javob bering",
} as const;

export function LessonPlayer({ initial, adapter, backHref, preview, onBack, notebook, startPageId }: Props) {
  const [view, setView] = useState(initial);
  // Aniq sahifa so'ralgan bo'lsa shu sahifadan; aks holda oxirgi tasdiqlangan sahifadan davom etamiz (faqat ochiq sahifalar ichida)
  const [index, setIndex] = useState(() => {
    const wanted = startPageId ? initial.pages.findIndex((p) => p.id === startPageId) : -1;
    if (wanted >= 0 && wanted < initial.unlocked) return wanted;
    const last = initial.lastPageIndex ?? 0;
    return Math.max(0, Math.min(last, initial.unlocked - 1, initial.totalPages - 1));
  });
  const [busy, setBusy] = useState(false);
  const [completion, setCompletion] = useState<{ firstTime?: boolean; xp?: XpAward | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set(initial.visitedPageIds ?? []));
  const sent = useRef<Set<string>>(new Set(initial.visitedPageIds ?? []));

  const page = view.pages[Math.min(index, view.pages.length - 1)];
  const isLast = index >= view.totalPages - 1;
  const nextOpen = index + 1 < view.unlocked;

  // Sahifa ochilganda serverga "ko'rildi" deb yozamiz (har sahifa uchun bir marta). Bu tugatish EMAS.
  useEffect(() => {
    if (preview || !adapter.visit || !page || sent.current.has(page.id)) return;
    sent.current.add(page.id);
    const id = page.id;
    adapter.visit(id).then((ok) => {
      if (ok) setVisited((s) => new Set(s).add(id));
      else sent.current.delete(id);
    });
  }, [page, adapter, preview]);

  const onAnswer = useCallback(
    async (blockId: string, payload: Record<string, unknown>) => {
      setError(null);
      const res = await adapter.answer(blockId, payload);
      if (!res) {
        setError("Javobni yuborib bo'lmadi. Qayta urinib ko'ring");
        return null;
      }
      if (res.view) setView(res.view);
      return res.result;
    },
    [adapter],
  );

  const finish = async () => {
    setBusy(true);
    const res = await adapter.complete();
    setBusy(false);
    if (res.ok) {
      setView((v) => ({ ...v, completed: true }));
      // XP faqat server qaytargan haqiqiy natija bo'yicha ko'rsatiladi (preview'da yo'q)
      if (!preview) setCompletion({ firstTime: res.firstTime, xp: res.xp });
    }
    else setError("Darsni yakunlab bo'lmadi");
  };

  const seen = visited.size;
  const required = view.progress?.required;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
            ← Muharrirga qaytish
          </button>
        ) : (
          <Link href={backHref} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
            ← Mavzuga qaytish
          </Link>
        )}
        {preview ? <span className="label border-[3px] border-ink bg-acid px-2.5 py-1.5">Ko&apos;rib chiqish</span> : null}
        {!preview && view.review ? (
          <span className="label border-[3px] border-ink bg-sky px-2.5 py-1.5">Qayta ko&apos;rib chiqish · natija saqlangan</span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="display-cond text-2xl sm:text-4xl">{view.lesson.title}</h1>
        <p className="label shrink-0">
          {index + 1} / {view.totalPages}
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {Array.from({ length: view.totalPages }, (_, i) => {
          const pid = view.pages[i]?.id;
          const isVisited = pid ? visited.has(pid) : false;
          return <div key={i} className={cn("h-2.5 flex-1 border-2 border-ink", i === index ? "bg-acid" : isVisited ? "bg-ink" : i < view.unlocked ? "bg-paper-2" : "bg-white")} />;
        })}
      </div>
      {/* Ko'rib chiqish progressi, majburiy topshiriqlar va tugatish — alohida ko'rsatkichlar */}
      {!preview ? (
        <p className="label mt-2 flex flex-wrap gap-x-4 gap-y-1" data-testid="lesson-progress">
          <span>
            {seen} / {view.totalPages} sahifa ko&apos;rildi
          </span>
          {required && required.total > 0 ? (
            <span>
              Majburiy topshiriqlar: {required.done} / {required.total}
            </span>
          ) : null}
          <span className={view.completed ? "font-black" : "opacity-70"}>{view.completed ? "Dars tugatilgan ✓" : "Dars hali tugatilmagan"}</span>
        </p>
      ) : null}
      {notebook && !preview ? <NotebookTools lessonId={view.lesson.id} page={{ id: page.id, title: page.title }} /> : null}

      <div className="mt-5">
        {page.title ? <p className="label mb-2">{page.title}</p> : null}
        <PageView key={page.id} blocks={page.blocks} mode="play" attempts={view.attempts} onAnswer={onAnswer} />
      </div>

      {error ? (
        <p role="alert" className="mt-4 border-[3px] border-ink bg-tomato p-3 font-semibold">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className={cn(buttonClasses("paper"), "disabled:pointer-events-none disabled:opacity-40")}>
          ← Oldingi
        </button>
        {!nextOpen && !isLast && page.gate !== "free" ? <p className="label max-w-xs text-right">{GATE_HINT[page.gate]}</p> : null}
        {!isLast ? (
          <button type="button" disabled={!nextOpen} onClick={() => setIndex(index + 1)} className={cn(buttonClasses("acid"), "disabled:pointer-events-none disabled:opacity-40")}>
            Keyingi →
          </button>
        ) : view.completed ? (
          <Link href={backHref} className={buttonClasses("acid")}>
            Dars tugadi ✓
          </Link>
        ) : (
          <button type="button" disabled={!view.allDone || busy} onClick={finish} className={cn(buttonClasses("acid"), "disabled:pointer-events-none disabled:opacity-40")}>
            {busy ? "…" : "Darsni yakunlash"}
          </button>
        )}
      </div>
      {completion && <XpResult award={completion.xp} firstTime={completion.firstTime} kind="lesson" />}
      {isLast && !view.allDone && page.gate !== "free" ? <p className="label mt-3 text-right">{GATE_HINT[page.gate]}</p> : null}
    </div>
  );
}
