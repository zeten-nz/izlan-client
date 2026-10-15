"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";
import { primaryBtn, smallBtn } from "@/features/notebook/ui";
import type { XpAward } from "@/features/profile/types";
import { XpResult } from "@/features/profile/xp";

export type QuizView =
  | { available: false; maxXp: number }
  | {
      available: true;
      quizId: string;
      title: string;
      questions: { id: string; text: string; options: { id: string; text: string }[] }[];
      bestScorePct: number | null;
      attempts: number;
      tiers: { minPct: number; xp: number; earned: boolean }[];
      maxXp: number;
    };

type Result = { scorePct: number; correct: number; total: number; results: { questionId: string; correct: boolean }[]; xp: XpAward };

/** Mavzu testi (o'quvchi). Natija va XP serverda hisoblanadi; bu yerda faqat javoblar yuboriladi. */
export function QuizPanel({ topicId, quiz }: { topicId: string; quiz: QuizView }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "taking" | "done">("idle");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  if (!quiz.available) return null;
  const total = quiz.questions.length;
  const answered = Object.keys(answers).length;

  async function submit() {
    if (!quiz.available) return;
    setBusy(true);
    setError("");
    const r = await apiPost<Result>(`/learning/topics/${topicId}/quiz/submit`, { answers });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setResult(r.data);
    setPhase("done");
    router.refresh();
  }

  return (
    <section aria-label="Mavzu testi" className="mt-10 border-[3px] border-ink bg-white p-4 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display-cond text-2xl sm:text-3xl [overflow-wrap:anywhere]">{quiz.title}</h2>
        <span className="label">{total} ta savol</span>
      </div>

      {phase === "idle" && (
        <>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="XP bo'sag'alari">
            {quiz.tiers.map((t) => (
              <li key={t.minPct} className={cn("label border-2 border-ink px-2 py-1", t.earned ? "bg-acid" : "bg-paper-2")}>
                {t.minPct}% → +{t.xp} XP{t.earned ? " ✓" : ""}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink/75">
            {quiz.bestScorePct === null ? "Hali topshirilmagan." : `Eng yaxshi natija: ${quiz.bestScorePct}% · ${quiz.attempts} ta urinish.`} Qayta topshirsangiz,
            faqat ilgari olinmagan bo&apos;sag&apos;alar uchun XP beriladi.
          </p>
          <button type="button" className={cn(primaryBtn, "mt-4")} onClick={() => setPhase("taking")}>
            {quiz.attempts ? "Qayta topshirish" : "Testni boshlash"}
          </button>
        </>
      )}

      {phase === "taking" && (
        <form
          className="mt-4 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {quiz.questions.map((q, i) => (
            <fieldset key={q.id} className="border-[3px] border-ink p-3 sm:p-4">
              <legend className="label px-1">{i + 1}-savol</legend>
              <p className="font-semibold [overflow-wrap:anywhere]">{q.text}</p>
              <div className="mt-3 grid gap-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border-[3px] border-ink px-3 py-2.5 focus-within:outline-[3px] focus-within:outline-cobalt",
                      answers[q.id] === o.id ? "bg-acid" : "bg-paper hover:bg-acid/40",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-1 size-4 accent-ink"
                      checked={answers[q.id] === o.id}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{o.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {error && (
            <p role="alert" className="label border-2 border-ink bg-tomato px-2 py-1 text-paper">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy || answered === 0} className={primaryBtn}>
              {busy ? "Tekshirilmoqda..." : "Yuborish"}
            </button>
            <span className="label tabular-nums">
              {answered} / {total} javob
            </span>
          </div>
        </form>
      )}

      {phase === "done" && result && (
        <div className="mt-4">
          <p className="display-cond text-4xl tabular-nums">{result.scorePct}%</p>
          <p className="label mt-1 tabular-nums">
            {result.correct} / {result.total} to&apos;g&apos;ri
          </p>
          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Savollar natijasi">
            {result.results.map((r, i) => (
              <li
                key={r.questionId}
                aria-label={`${i + 1}-savol: ${r.correct ? "to'g'ri" : "noto'g'ri"}`}
                className={cn("grid size-8 place-items-center border-2 border-ink font-mono text-xs font-bold", r.correct ? "bg-acid" : "bg-tomato text-paper")}
              >
                {i + 1}
              </li>
            ))}
          </ol>
          <XpResult award={result.xp} kind="quiz" />
          <button
            type="button"
            className={cn(smallBtn, "mt-4")}
            onClick={() => {
              setAnswers({});
              setResult(null);
              setPhase("idle");
            }}
          >
            Yopish
          </button>
        </div>
      )}
    </section>
  );
}
