import type { Metadata } from "next";
import { Suspense } from "react";
import { ROUTES } from "@/config/routes";
import { StudentLessonRunner } from "@/features/lessons/player/StudentLessonRunner";
import type { PlayerView } from "@/features/lessons/types";
import { apiGet } from "@/server/api";

export const metadata: Metadata = { title: "Dars", robots: { index: false } };

type Params = Promise<{ id: string }>;
type Search = Promise<{ page?: string }>;

async function LessonContent({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ id }, { page }] = await Promise.all([params, searchParams]);
  const view = await apiGet<PlayerView>(`/learning/lessons/${id}`, { forbiddenTo: ROUTES.student });
  return <StudentLessonRunner initial={view} backHref={`${ROUTES.student}/topic/${view.lesson.topicId}?stay=1`} startPageId={page} />;
}

export default function LessonPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <LessonContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
