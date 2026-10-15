"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { apiPost } from "@/lib/api";
import type { XpAward } from "@/features/profile/types";
import type { AnswerResult, PlayerView } from "../types";
import { LessonPlayer, type PlayerAdapter } from "./LessonPlayer";

/** O'quvchi: javoblar serverda tekshiriladi, ochilgan sahifalar va ko'rilgan sahifalar serverdan keladi. */
export function StudentLessonRunner({ initial, backHref, startPageId }: { initial: PlayerView; backHref: string; startPageId?: string }) {
  const router = useRouter();
  const lessonId = initial.lesson.id;
  const adapter = useMemo<PlayerAdapter>(
    () => ({
      async answer(blockId, payload) {
        const r = await apiPost<{ result: AnswerResult; view: PlayerView }>(`/learning/lessons/${lessonId}/answer`, { blockId, payload });
        return r.ok ? r.data : null;
      },
      async complete() {
        const r = await apiPost<{ firstTime: boolean; xp: XpAward | null }>(`/learning/lessons/${lessonId}/complete`, {});
        // Asosiy, Jarayon va Xarita yangilangan holatni ko'rsatsin
        if (r.ok) router.refresh();
        return r.ok ? { ok: true, firstTime: r.data.firstTime, xp: r.data.xp } : { ok: false };
      },
      async visit(pageId) {
        return (await apiPost(`/learning/lessons/${lessonId}/visit`, { pageId })).ok;
      },
    }),
    [lessonId, router],
  );
  return <LessonPlayer initial={initial} adapter={adapter} backHref={backHref} notebook startPageId={startPageId} />;
}
