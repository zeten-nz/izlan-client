"use client";

import { useCallback, useEffect, useState } from "react";
import { FormAlert } from "@/features/auth/components/fields";
import { apiGetJson, apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { PlacementQuestionView, PlacementResultView } from "../types";
import { Roadmap, type RoadmapLevel } from "./Roadmap";

type View = PlacementQuestionView | PlacementResultView;

const LETTERS = ["A", "B", "C", "D"];
const btn =
  "inline-flex items-center justify-center border-[3px] border-ink px-6 py-3.5 font-display text-[16px] font-black uppercase tracking-tight shadow-[5px_5px_0_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60";

export function PlacementRunner({ id }: { id: string }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void apiGetJson<View>(`/learning/placements/${id}`).then((res) => {
      if (!alive) return;
      if (res.ok) setView(res.data);
      else if (res.status === 401) window.location.assign("/login");
      else setError(res.message);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const submit = useCallback(async () => {
    if (!view || view.status !== "IN_PROGRESS" || selected === null || busy) return;
    setBusy(true);
    setError("");
    const res = await apiPost<View>(`/learning/placements/${id}/answer`, { questionId: view.question.id, choice: selected });
    setBusy(false);
    if (!res.ok) {
      if (res.status === 409) {
        // Boshqa oynada javob berilgan bo'lishi mumkin: holatni qayta yuklaymiz
        const fresh = await apiGetJson<View>(`/learning/placements/${id}`);
        if (fresh.ok) {
          setView(fresh.data);
          setSelected(null);
          return;
        }
      }
      return setError(res.message);
    }
    setSelected(null);
    setView(res.data);
    window.scrollTo({ top: 0 });
  }, [view, selected, busy, id]);

  // Klaviatura: A-D / 1-4 tanlash, Enter tasdiqlash
  useEffect(() => {
    if (!view || view.status !== "IN_PROGRESS") return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const i = ["a", "b", "c", "d"].indexOf(k);
      const n = ["1", "2", "3", "4"].indexOf(k);
      if (i >= 0 || n >= 0) setSelected(i >= 0 ? i : n);
      if (e.key === "Enter" && selected !== null && !(e.target instanceof HTMLButtonElement)) void submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, selected, submit]);

  if (!view) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-8">
        {error ? (
          <div className="space-y-4">
            <FormAlert>{error}</FormAlert>
            <a href="/student" className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">← Asosiyga qaytish</a>
          </div>
        ) : (
          <p className="label">Test yuklanmoqda...</p>
        )}
      </div>
    );
  }

  if (view.status === "DONE") return <Result view={view} />;

  const parts = view.question.prompt.split("_____");
  const progress = view.total ? ((view.index - 1) / view.total) * 100 : Math.min(95, ((view.index - 1) / 30) * 100);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="label border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">
          {view.mode === "CLAIMED" ? `Daraja testi · ${view.levelCode}` : "Darajani aniqlash"}
        </span>
        <span className="label" aria-live="polite">
          {view.total ? `Savol ${view.index} / ${view.total}` : `Savol ${view.index}`}
        </span>
      </div>
      <div className="mt-4 h-5 border-[3px] border-ink bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Test jarayoni">
        <div className="h-full bg-tomato transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
      {!view.total && <p className="label mt-2 text-ink/60">10 tadan 30 tagacha savol</p>}

      <section className="mt-8 border-[3px] border-ink bg-white p-5 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-8" aria-labelledby="q">
        <p className="label text-ink/70">{view.question.instruction}</p>
        <h1 id="q" className="mt-4 text-[clamp(22px,3.4vw,32px)] font-bold leading-snug">
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span className="mx-1 inline-block min-w-20 border-b-[4px] border-ink align-baseline">&nbsp;</span>
              {parts[1]}
            </>
          ) : (
            view.question.prompt
          )}
        </h1>

        <div role="radiogroup" aria-labelledby="q" className="mt-6 grid gap-3 sm:grid-cols-2">
          {view.question.options.map((o, i) => (
            <button
              key={`${view.question.id}-${i}`}
              type="button"
              role="radio"
              aria-checked={selected === i}
              onClick={() => setSelected(i)}
              className={cn(
                "flex items-center gap-3 border-[3px] border-ink p-3.5 text-left text-lg font-semibold shadow-[4px_4px_0_0_var(--color-ink)] transition hover:-translate-y-0.5",
                selected === i ? "bg-acid" : "bg-paper",
              )}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center border-[3px] border-ink font-mono text-sm font-bold", selected === i ? "bg-ink text-acid" : "bg-white")}>{LETTERS[i]}</span>
              <span>{o}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5">
        <FormAlert>{error}</FormAlert>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => void submit()} disabled={selected === null || busy} className={cn(btn, "bg-acid")}>
          {busy ? "Kuting..." : view.total && view.index === view.total ? "Yakunlash →" : "Javobni tasdiqlash →"}
        </button>
        <p className="text-sm text-ink/60">Test davomida to&apos;g&apos;ri javob ko&apos;rsatilmaydi. Tushuntirishlar natijadan keyin.</p>
      </div>
    </div>
  );
}

const COPY: Record<PlacementResultView["outcome"], { sticker: string; tone: string }> = {
  RETEST_LOWER: { sticker: "Testdan o'tmadi", tone: "bg-tomato" },
  START_ZERO: { sticker: "Natija", tone: "bg-bubble" },
  REPEAT_OPEN: { sticker: "Yaxshi natija", tone: "bg-sky" },
  ADVANCE: { sticker: "A'lo natija!", tone: "bg-acid" },
  MASTERED: { sticker: "A'lo natija!", tone: "bg-acid" },
  PLACED: { sticker: "Daraja aniqlandi", tone: "bg-acid" },
};

function verdict(v: PlacementResultView): { title: string; text: string } {
  const claimed = v.claimedCode ?? "";
  const res = v.resultCode ?? "";
  switch (v.outcome) {
    case "RETEST_LOWER":
      return {
        title: `${claimed} sizga hozircha qiyin`,
        text: `Natija 45% dan past. Osonroq test tavsiya qilamiz: ${res} darajasidan qayta topshirib ko'ring.`,
      };
    case "START_ZERO":
      return v.scorePct < 45
        ? { title: `${res} ni noldan boshlaymiz`, text: "Bu eng quyi daraja, shuning uchun asosdan boshlaymiz. Mavzular tartib bilan ochiladi." }
        : {
            title: `${res} ni noldan boshlaymiz`,
            text:
              v.scorePct < 60
                ? "Test o'tish chegarasiga yetmadi, lekin bilimingizning bir qismi bor. Shu darajani boshidan o'rganamiz, oldingi darajalar ochiq."
                : "Bilimingiz yaxshi, lekin hali to'liq emas. Shu darajani boshidan o'rganamiz, oldingi darajalar ochiq.",
          };
    case "REPEAT_OPEN":
      return {
        title: `${res} ni takrorlaymiz`,
        text: "Bu darajaning hamma darslari siz uchun ochiq. Xato qilgan mavzularingiz Asosiy sahifadagi \"Qayta takrorlash\" bo'limida, o'zingiz xohlagan mavzuni qayta o'qishingiz mumkin.",
      };
    case "ADVANCE":
      return { title: `Keyingi bosqich: ${res}`, text: `${claimed} darajasini muvaffaqiyatli tugatdingiz. Quyida ${res} dan boshlangan yangi yo'l xaritangiz.` };
    case "MASTERED":
      return { title: "Eng yuqori daraja!", text: "Siz yo'nalishdagi eng yuqori darajani tasdiqladingiz. Hamma darslar ochiq." };
    case "PLACED":
      return { title: `Darajangiz: ${res}`, text: `${v.resultTitle ?? ""} darajasini noldan boshlaymiz. Oldingi darajalar ochiq, keyingilari tartib bilan ochiladi.` };
  }
}

function Result({ view }: { view: PlacementResultView }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const copy = COPY[view.outcome];
  const v = verdict(view);
  const showMap = view.outcome !== "RETEST_LOWER";

  const levels: RoadmapLevel[] = view.levels.map((l) => ({
    ord: l.ord,
    code: l.code,
    title: l.title,
    state: l.ord < view.resultOrd ? "done" : l.ord === view.resultOrd ? "current" : "future",
  }));

  async function retest() {
    setBusy(true);
    setError("");
    const res = await apiPost<{ id: string }>(`/learning/directions/${view.directionId}/placement`, { mode: "CLAIMED", levelOrd: view.resultOrd });
    if (!res.ok) {
      setBusy(false);
      return setError(res.message);
    }
    window.location.assign(`/student/test/${res.data.id}`);
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-12">
      <div className={cn("border-[3px] border-ink p-5 shadow-[10px_10px_0_0_var(--color-ink)] sm:p-8", copy.tone)}>
        <span className="label inline-block -rotate-2 border-[3px] border-ink bg-paper px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">{copy.sticker}</span>
        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-2">
          <p className="display text-[clamp(72px,16vw,160px)] leading-[0.8]">{view.scorePct}%</p>
          <p className="label pb-2">
            {view.correct} / {view.total} to&apos;g&apos;ri
          </p>
        </div>
        <h1 className="display-cond mt-6 text-[clamp(30px,5vw,52px)]">{v.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-snug">{v.text}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {view.outcome === "RETEST_LOWER" && (
            <button type="button" onClick={() => void retest()} disabled={busy} className={cn(btn, "bg-ink text-paper")}>
              {busy ? "Kuting..." : `${view.resultCode} dan qayta test →`}
            </button>
          )}
          <a href="/student" className={cn(btn, view.outcome === "RETEST_LOWER" ? "bg-paper" : "bg-ink text-paper")}>
            Asosiyga o&apos;tish
          </a>
        </div>
        <div className="mt-4">
          <FormAlert>{error}</FormAlert>
        </div>
      </div>

      {view.perLevel.length > 1 && (
        <section className="mt-10" aria-label="Darajalar bo'yicha natija">
          <h2 className="display-cond text-2xl sm:text-3xl">Darajalar bo&apos;yicha</h2>
          <ul className="mt-4 space-y-3">
            {view.perLevel.map((l) => {
              const p = Math.round((l.correct / l.total) * 100);
              return (
                <li key={l.code} className="flex items-center gap-3">
                  <span className="display w-12 text-xl">{l.code}</span>
                  <div className="h-6 flex-1 border-[3px] border-ink bg-white">
                    <div className={cn("h-full", p >= 75 ? "bg-acid" : "bg-tomato")} style={{ width: `${p}%` }} />
                  </div>
                  <span className="label w-20 text-right">{l.correct}/{l.total}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {showMap && (
        <section className="mt-12" aria-label="Yo'l xaritasi">
          <h2 className="display-cond mb-6 text-2xl sm:text-3xl">Sizning yo&apos;l xaritangiz</h2>
          <Roadmap levels={levels} variant="preview" />
        </section>
      )}

      {view.wrong.length > 0 && (
        <section className="mt-12" aria-label="Xatolar">
          <h2 className="display-cond text-2xl sm:text-3xl">Xatolaringiz ({view.wrong.length})</h2>
          <p className="mt-2 text-ink/75">Batafsil tushuntirish Asosiy sahifadagi &quot;Qayta takrorlash&quot; bo&apos;limida, mavzu bo&apos;yicha jamlangan holda.</p>
          <ul className="mt-4 space-y-3">
            {view.wrong.map((w, i) => (
              <li key={i} className="border-[3px] border-ink bg-white p-4">
                <p className="label">{w.levelCode} · {w.ruleTitle}</p>
                <p className="mt-1 font-semibold leading-snug">{w.prompt}</p>
                <p className="mt-2 text-[15px]">
                  Sizning javobingiz: <span className="bg-tomato/70 px-1 line-through">{w.options[w.chosenIndex]}</span> · To&apos;g&apos;ri:{" "}
                  <span className="bg-acid px-1 font-bold">{w.options[w.correctIndex]}</span>
                </p>
                <p className="mt-1"><em className="serif-i text-lg">{w.correctSentence}</em></p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
