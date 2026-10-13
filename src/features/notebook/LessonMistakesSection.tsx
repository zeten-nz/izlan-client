"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { BLANK_RE } from "@/features/lessons/types";
import type { FilterOptions, LessonMistake } from "./types";
import { usePagedList } from "./usePagedList";
import { EmptyState, LoadMore, LoadState, Toolbar, fmtDate, lessonHref, primaryBtn, smallBtn } from "./ui";

function Card({ m }: { m: LessonMistake }) {
  const parts = m.kind === "fillblank" ? m.question.split(BLANK_RE) : [];
  return (
    <article className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]" data-testid="lesson-mistake">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="label">
          {m.lessonTitle}
          {m.pageTitle ? ` · ${m.pageTitle}` : ` · ${m.pageIndex + 1}-sahifa`}
        </p>
        <span className="flex flex-wrap gap-1.5">
          <span className="label border-2 border-ink bg-tomato px-1.5 py-0.5 text-[10px]">{m.wrongTries} marta xato</span>
          <span className={cn("label border-2 border-ink px-1.5 py-0.5 text-[10px]", m.resolved ? "bg-[#8df0a8]" : "bg-acid")}>
            {m.resolved ? "Keyin to'g'ri bajarilgan ✓" : "Hali to'g'ri bajarilmagan"}
          </span>
        </span>
      </div>

      {m.kind === "choice" ? (
        <>
          <p className="mt-2 text-lg font-semibold leading-snug">{m.question}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {m.options?.map((o) => (
              <li
                key={o.id}
                className={cn(
                  "flex items-center gap-2 border-[3px] border-ink px-3 py-2",
                  o.correct ? "bg-acid font-bold" : o.chosen ? "bg-tomato/80" : "border-ink/25 text-ink/60",
                )}
              >
                <span>{o.text}</span>
                {o.correct ? <span className="label ml-auto text-[10px]">To&apos;g&apos;ri</span> : null}
                {o.chosen && !o.correct ? <span className="label ml-auto text-[10px]">Oxirgi javobingiz</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-lg font-semibold leading-[2]">
          {parts.map((p, i) => {
            if (i % 2 === 0) return <span key={i}>{p}</span>;
            const b = m.blanks?.find((x) => x.id === p);
            return (
              <span key={i} className="mx-1 inline-block">
                <span className={cn("border-b-[3px] border-ink px-2 font-bold", b?.ok ? "bg-[#8df0a8]" : "bg-tomato/60")}>{b?.given || "___"}</span>
                {b?.answers ? <span className="label ml-1 text-[10px]">→ {b.answers[0]}</span> : null}
              </span>
            );
          })}
        </p>
      )}

      {m.explanation ? <p className="mt-3 border-l-[6px] border-ink bg-paper px-3 py-2 text-[15px]">{m.explanation}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {m.topic.accessible ? (
          <Link href={lessonHref(m.lessonId, m.pageId)} className={primaryBtn}>
            Darsga qaytib {m.resolved ? "qayta ko'rish" : "qayta urinish"} →
          </Link>
        ) : (
          <span className="label text-ink/60">Mavzu hozir ochiq emas</span>
        )}
        {m.topic.accessible ? (
          <Link href={`${ROUTES.student}/topic/${m.topic.id}?stay=1`} className={smallBtn}>
            Mavzuni takrorlash
          </Link>
        ) : null}
        <span className="label ml-auto text-[10px]">
          {m.tries} urinish · {fmtDate(m.lastAt)}
        </span>
      </div>
      {!m.fromCurrentVersion ? <p className="mt-2 text-sm text-ink/60">Dars keyin yangilangan: bu savol eski nashrdan.</p> : null}
    </article>
  );
}

/** Dars bloklaridagi xatolar (mashq/placement xatolari alohida: ReviewPanel). */
export function LessonMistakesSection({ options }: { options: FilterOptions }) {
  const [topicId, setTopicId] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const list = usePagedList<LessonMistake>("/notebook/lesson-mistakes", { topicId: topicId || undefined, unresolvedOnly: onlyOpen ? "true" : undefined }, 10);

  return (
    <section aria-label="Darslardagi xatolar" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display-cond text-2xl sm:text-3xl">Darslardagi xatolar</h2>
      </div>
      <Toolbar
        options={options}
        directionId={directionId}
        topicId={topicId}
        onDirection={setDirectionId}
        onTopic={setTopicId}
        extra={
          <label className="flex items-center gap-2 border-[3px] border-ink bg-white px-3 py-2 text-[15px] font-semibold">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="size-4 accent-ink" />
            Faqat hal bo&apos;lmaganlar
          </label>
        }
      />
      <LoadState status={list.status} error={list.error} onRetry={() => void list.reload()} />
      {list.status === "ready" && list.items.length === 0 ? (
        <EmptyState title={onlyOpen || topicId ? "Hech narsa topilmadi" : "Darslarda xato yo'q"}>
          Dars savollarida noto&apos;g&apos;ri javob bersangiz, u shu yerda tushuntirish bilan paydo bo&apos;ladi.
        </EmptyState>
      ) : null}
      {list.items.length > 0 ? (
        <div className="space-y-4">
          {list.items.map((m) => (
            <Card key={m.id} m={m} />
          ))}
        </div>
      ) : null}
      {list.status === "ready" && list.items.length > 0 ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={() => void list.loadMore()} shown={list.items.length} total={list.total} />
      ) : null}
    </section>
  );
}
