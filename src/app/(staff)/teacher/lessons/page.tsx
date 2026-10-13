import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherLessons, type CatalogDirection, type LessonRow } from "@/features/lessons/TeacherLessons";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Darslarim", robots: { index: false } };

async function Lessons() {
  await requireRole("TEACHER");
  const [{ lessons }, { directions }] = await Promise.all([
    apiGet<{ lessons: LessonRow[] }>("/staff/lessons"),
    apiGet<{ directions: CatalogDirection[] }>("/staff/catalog"),
  ]);
  return <TeacherLessons lessons={lessons} directions={directions.filter((d) => d.levels.some((l) => l.topics.length))} />;
}

export default function TeacherLessonsPage() {
  return (
    <Suspense fallback={<div className="label grid min-h-[50vh] place-items-center">Yuklanmoqda...</div>}>
      <Lessons />
    </Suspense>
  );
}
