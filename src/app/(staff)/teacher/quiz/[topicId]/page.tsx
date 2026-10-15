import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { QuizEditor, type EditorData } from "@/features/quiz/QuizEditor";
import { apiGet } from "@/server/api";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Mavzu testi", robots: { index: false } };

async function Editor({ params }: { params: Promise<{ topicId: string }> }) {
  const [{ topicId }, user] = await Promise.all([params, requireUser()]);
  // Vakolatni server tekshiradi (begona mavzu -> 403 -> 404 sahifa)
  const data = await apiGet<EditorData>(`/staff/quizzes/topic/${topicId}`);
  const back = user.role === "ADMIN" ? "/admin" : "/teacher/lessons";
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 sm:py-10">
      <Link href={back} className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
        ← Orqaga
      </Link>
      <p className="label mt-6">Mavzu testi</p>
      <h1 className="display-cond mt-2 text-[clamp(28px,5vw,48px)] [overflow-wrap:anywhere]">{data.topic.title}</h1>
      <div className="mt-6">
        <QuizEditor data={data} />
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ topicId: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[50vh] place-items-center">Yuklanmoqda...</div>}>
      <Editor params={params} />
    </Suspense>
  );
}
