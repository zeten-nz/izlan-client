"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetJson, apiPost } from "@/lib/api";
import { LessonPlayer, type PlayerAdapter } from "../player/LessonPlayer";
import { isInteractive, type AnswerResult, type AttemptView, type PlayerPage, type PlayerView } from "../types";

/** Mijozdagi gating hisobi (serverdagi unlockedCount bilan bir xil qoida). */
function buildView(lessonId: string, title: string, pages: PlayerPage[], attempts: Record<string, AttemptView>): PlayerView {
  let unlocked = pages.length;
  let allDone = true;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const ok =
      p.gate === "free" ||
      p.blocks.filter(isInteractive).every((b) => {
        const a = attempts[b.id];
        return p.gate === "answered" ? !!a : !!a?.everCorrect;
      });
    if (!ok) {
      unlocked = i + 1;
      allDone = false;
      break;
    }
  }
  return {
    lesson: { id: lessonId, title, topicId: "" },
    totalPages: pages.length,
    unlocked,
    allDone,
    completed: false,
    pages: pages.slice(0, unlocked),
    attempts,
  };
}

/** Ustoz uchun: o'quvchi ko'rinishi, hech narsa saqlanmaydi (javoblar faqat tekshiriladi). */
export function PreviewRunner({ lessonId, title, onBack, version }: { lessonId: string; title: string; onBack: () => void; version: number }) {
  const [pages, setPages] = useState<PlayerPage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    apiGetJson<{ pages: PlayerPage[] }>(`/staff/lessons/${lessonId}/preview`).then((r) => {
      if (!live) return;
      if (r.ok) setPages(r.data.pages);
      else setError(r.message);
    });
    return () => {
      live = false;
    };
  }, [lessonId, version]);

  if (error) return <p role="alert" className="m-6 border-[3px] border-ink bg-tomato p-4 font-semibold">{error}</p>;
  if (!pages) return <div className="label grid min-h-[40vh] place-items-center">Yuklanmoqda...</div>;
  return <PreviewInner key={version} lessonId={lessonId} title={title} pages={pages} onBack={onBack} />;
}

function PreviewInner({ lessonId, title, pages, onBack }: { lessonId: string; title: string; pages: PlayerPage[]; onBack: () => void }) {
  const { initial, adapter } = useMemo(() => {
    const attempts: Record<string, AttemptView> = {};
    const adapter: PlayerAdapter = {
      async answer(blockId, payload) {
        const r = await apiPost<AnswerResult>(`/staff/lessons/${lessonId}/preview/answer`, { blockId, payload });
        if (!r.ok) return null;
        const prev = attempts[blockId];
        attempts[blockId] = {
          correct: r.data.correct,
          everCorrect: r.data.correct || !!prev?.everCorrect,
          tries: (prev?.tries ?? 0) + 1,
          response: payload,
        };
        return { result: r.data, view: buildView(lessonId, title, pages, { ...attempts }) };
      },
      async complete() {
        return true;
      },
    };
    return { initial: buildView(lessonId, title, pages, attempts), adapter };
  }, [lessonId, title, pages]);

  return <LessonPlayer initial={initial} adapter={adapter} backHref="#" onBack={onBack} preview />;
}
