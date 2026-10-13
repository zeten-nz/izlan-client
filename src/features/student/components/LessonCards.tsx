import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import type { LessonItem } from "../types";

export const btn =
  "inline-flex items-center justify-center border-[3px] border-ink px-5 py-3 font-display text-[15px] font-black uppercase tracking-tight shadow-[4px_4px_0_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]";

const lessonHref = (id: string) => `${ROUTES.student}/lesson/${id}`;

/** Asosiy sahifaning eng muhim bloki: yo'nalish → daraja → mavzu → dars, progress va davom ettirish. */
export function ContinueCard({ item }: { item: LessonItem }) {
  const resume = item.status === "continue";
  return (
    <div className="relative border-[3px] border-ink bg-acid p-5 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-8" data-testid="continue-card">
      <span className="label absolute -top-4 right-4 rotate-2 border-[3px] border-ink bg-tomato px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">
        {resume ? "Davom ettirish" : "Keyingi dars"}
      </span>
      <p className="label">
        {item.direction.title} · {item.levelCode} · {item.topic.ord}-mavzu: {item.topic.title}
      </p>
      <h2 className="display mt-3 text-[clamp(28px,4.5vw,52px)] leading-[0.95]">{item.title}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="label" data-testid="continue-review">
          {resume ? `${item.reviewPct}% sahifa ko'rildi` : `${item.pages} sahifa`}
        </p>
        <p className="label">
          Mavzu: {item.topic.lessons.completed} / {item.topic.lessons.total} dars tugatildi
        </p>
      </div>
      {resume ? (
        <div className="mt-3 h-3 max-w-md border-[3px] border-ink bg-white" aria-hidden>
          <div className="h-full bg-ink" style={{ width: `${item.reviewPct}%` }} />
        </div>
      ) : null}
      <Link href={lessonHref(item.lessonId)} className={cn(btn, "mt-5 bg-ink text-paper")}>
        {resume ? "Davom ettirish →" : "Darsni boshlash →"}
      </Link>
    </div>
  );
}

/** "Keyingi darslar": mavjud ma'lumotdan (DailyPlan emas) hisoblangan ro'yxat. */
export function NextLessonList({ items }: { items: LessonItem[] }) {
  return (
    <ul className="space-y-4" data-testid="next-lessons">
      {items.map((l) => (
        <li key={l.lessonId}>
          <Link
            href={lessonHref(l.lessonId)}
            className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-ink bg-white p-4 shadow-[5px_5px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 sm:p-5"
          >
            <span className="min-w-0">
              <span className="display-cond block text-xl sm:text-2xl">{l.title}</span>
              <span className="label mt-1 block">
                {l.direction.title} · {l.levelCode} · {l.topic.ord}-mavzu: {l.topic.title}
              </span>
            </span>
            <span className={cn("label shrink-0 border-[3px] border-ink px-2.5 py-1.5", l.status === "continue" ? "bg-acid" : "bg-paper")}>
              {l.status === "continue" ? `Davom ettirish · ${l.reviewPct}%` : "Boshlash →"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
