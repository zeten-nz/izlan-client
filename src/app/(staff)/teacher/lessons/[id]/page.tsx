import type { Metadata } from "next";
import { Suspense } from "react";
import { LessonEditor, type EditorInitial } from "@/features/lessons/editor/LessonEditor";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Dars muharriri", robots: { index: false } };

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("TEACHER");
  const { id } = await params;
  const lesson = await apiGet<EditorInitial & { topicId: string }>(`/staff/lessons/${id}`);
  return <LessonEditor key={lesson.id} initial={{ id: lesson.id, title: lesson.title, draft: lesson.draft, published: lesson.published }} />;
}

export default function LessonEditorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <Editor params={params} />
    </Suspense>
  );
}
