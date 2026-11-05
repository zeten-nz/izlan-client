import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ROUTES } from "@/config/routes";
import { apiGet } from "@/server/api";
import { QuizPanel, type QuizView } from "@/features/quiz/QuizPanel";

export const metadata: Metadata = { title: "Mavzu", robots: { index: false } };

type TopicView = { id: string; title: string; ord: number; levelCode: string; levelTitle: string; directionTitle: string };
type TopicLessons = {
  topic: { totalLessons: number; completedLessons: number; topicCompleted: boolean; contentPreparing: boolean };
  lessons: { id: string; title: string; pages: number; completed: boolean }[];
};

async function TopicContent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ stay?: string }> }) {
  const [{ id }, { stay }] = await Promise.all([params, searchParams]);
  const topic = await apiGet<TopicView>(`/learning/topics/${id}`, { forbiddenTo: ROUTES.student });
  const { lessons, topic: progress } = await apiGet<TopicLessons>(`/learning/topics/${id}/lessons`);
  const quiz = await apiGet<QuizView>(`/learning/topics/${id}/quiz`);

  // Mavzuda bitta dars bo'lsa, oraliq sahifa kerak emas. Playerdan "Mavzuga qaytish" (?stay=1) bu qoidani o'tkazadi.
  if (lessons.length === 1 && !stay && !quiz.available) redirect(`${ROUTES.student}/lesson/${lessons[0].id}`);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8 sm:py-12">
      <Link href={ROUTES.student} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
        ← Asosiy
      </Link>
      <div className="mt-6 border-[3px] border-ink bg-acid p-5 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-8">
        <p className="label">
          {topic.directionTitle} · {topic.levelCode} · {topic.levelTitle} · {topic.ord}-mavzu
        </p>
        <h1 className="display mt-3 text-[clamp(32px,6vw,72px)] leading-[0.95]">{topic.title}</h1>
        {!progress.contentPreparing ? (
          <p className="label mt-4 inline-block border-[3px] border-ink bg-white px-3 py-1.5" data-testid="topic-progress">
            {progress.completedLessons} / {progress.totalLessons} dars tugatildi
            {progress.topicCompleted ? " · mavzu yakunlandi ✓" : ""}
          </p>
        ) : null}
      </div>
      {lessons.length ? (
        <ol className="mt-8 space-y-4">
          {lessons.map((l, i) => (
            <li key={l.id}>
              <Link
                href={`${ROUTES.student}/lesson/${l.id}`}
                className="flex items-center justify-between gap-4 border-[3px] border-ink bg-white p-5 shadow-[5px_5px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-4">
                  <span className="grid size-9 shrink-0 place-items-center border-2 border-ink bg-paper font-mono text-sm font-bold">{i + 1}</span>
                  <span>
                    <span className="display-cond block text-2xl sm:text-3xl">{l.title}</span>
                    <span className="label mt-1 block">{l.pages} sahifa</span>
                  </span>
                </span>
                <span className={`label border-[3px] border-ink px-2.5 py-1.5 ${l.completed ? "bg-acid" : "bg-paper"}`}>
                  {l.completed ? "Tugatilgan ✓" : "Boshlash →"}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-8 border-[3px] border-dashed border-ink bg-white p-6 sm:p-8" data-testid="content-preparing">
          <p className="display-cond text-2xl">Kontent tayyorlanmoqda</p>
          <p className="mt-2 max-w-xl text-lg leading-snug">
            Bu mavzu uchun darslar hali nashr qilinmagan. Ular tayyor bo&apos;lgach shu yerda ko&apos;rinadi.
          </p>
        </div>
      )}
      <QuizPanel topicId={topic.id} quiz={quiz} />
    </div>
  );
}

export default function TopicPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ stay?: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <TopicContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
