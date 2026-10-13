"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { SectionHead } from "@/components/ui/SectionHead";
import { ROUTES, SECTIONS } from "@/config/routes";
import { cn } from "@/lib/cn";
import { FIT_QUESTIONS, type FitAnswers, type FitQuestionId } from "../content/copy";
import { evaluateFit, type FitTier } from "../lib/fit";

const TIER_STYLE: Record<FitTier, { bg: string; title: string }> = {
  yes: { bg: "bg-acid", title: "Ha, Izlan aynan sizga" },
  maybe: { bg: "bg-sky", title: "Mos, lekin bilib qo‘ying" },
  no: { bg: "bg-tomato", title: "Hozircha to‘liq mos emas" },
};

/**
 * Maslahatchi: 4 ta savol, halol xulosa. Maqsad sotish emas, to‘g‘ri qaror.
 * Mantiq lib/fit.ts da (test qilish oson), bu yerda faqat ko‘rinish.
 */
export function FitAdvisor() {
  const [answers, setAnswers] = useState<FitAnswers>({});
  const answered = Object.keys(answers).length;
  const done = answered === FIT_QUESTIONS.length;
  const result = useMemo(() => (done ? evaluateFit(answers) : null), [done, answers]);

  const pick = (q: FitQuestionId, optionId: string) => setAnswers((a) => ({ ...a, [q]: optionId }));

  return (
    <section id={SECTIONS.fit} className="relative overflow-hidden border-b-[3px] border-ink bg-sky">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div className="relative mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-36">
        <SectionHead
          index="04"
          kicker="Menga mosmi?"
          title={
            <>
              Sotmaymiz.<br />
              <span className="serif-i mt-4 inline-block bg-paper px-3 pb-2 normal-case">Maslahat beramiz.</span>
            </>
          }
          lead="To‘rtta savolga javob bering. Izlan sizga mos kelmasa, buni ochiq aytamiz va nima qilish kerakligini ham."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Savollar */}
          <div className="space-y-6">
            {FIT_QUESTIONS.map((q, qi) => (
              <fieldset key={q.id} className="border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_0_var(--color-ink)] md:p-7">
                <legend className="label -ml-2 border-[3px] border-ink bg-ink px-3 py-1 text-paper">
                  {qi + 1} / {FIT_QUESTIONS.length}
                </legend>
                <p className="display-cond mt-2 text-[clamp(26px,3vw,38px)]">{q.q}</p>
                <div className="mt-5 flex flex-wrap gap-3" role="radiogroup" aria-label={q.q}>
                  {q.options.map((o) => {
                    const active = answers[q.id] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => pick(q.id, o.id)}
                        className={cn(
                          "border-[3px] border-ink px-4 py-2.5 text-left font-bold transition-[transform,box-shadow,background] duration-150",
                          active
                            ? "translate-x-[2px] translate-y-[2px] bg-ink text-acid"
                            : "bg-paper shadow-[4px_4px_0_0_var(--color-ink)] hover:-translate-y-0.5 hover:bg-acid",
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {/* Xulosa */}
          <div className="lg:sticky lg:top-28 lg:self-start" aria-live="polite">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="border-[3px] border-dashed border-ink bg-paper/70 p-7"
                >
                  <p className="label mb-4">Xulosa</p>
                  <p className="display-cond text-4xl">Javoblarni kutyapman…</p>
                  <div className="mt-6 flex gap-2" aria-hidden>
                    {FIT_QUESTIONS.map((q) => (
                      <span
                        key={q.id}
                        className={cn("h-3 flex-1 border-[3px] border-ink", answers[q.id] ? "bg-ink" : "bg-paper")}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-ink/70">
                    {answered === 0 ? "Boshlash uchun birinchi savolga javob bering." : `${FIT_QUESTIONS.length - answered} ta savol qoldi.`}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={result.tier}
                  initial={{ opacity: 0, rotateX: -18, y: 20 }}
                  animate={{ opacity: 1, rotateX: 0, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className={cn("border-[3px] border-ink p-7 shadow-[8px_8px_0_0_var(--color-ink)]", TIER_STYLE[result.tier].bg)}
                  style={{ transformPerspective: 900 }}
                >
                  <p className="label mb-4">Xulosa</p>
                  <h3 className="display-cond text-[clamp(34px,4vw,54px)]">{TIER_STYLE[result.tier].title}</h3>
                  <p className="mt-3 text-lg font-medium leading-snug">{result.summary}</p>

                  <ul className="mt-6 space-y-3">
                    {result.notes.map((n) => (
                      <li key={n.text} className="flex gap-3 text-[15px] leading-snug">
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center border-[3px] border-ink text-[11px] font-black",
                            n.kind === "good" && "bg-ink text-acid",
                            n.kind === "warn" && "bg-paper",
                            n.kind === "bad" && "bg-tomato",
                          )}
                          aria-hidden
                        >
                          {n.kind === "good" ? "+" : n.kind === "warn" ? "!" : "×"}
                        </span>
                        <span>{n.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <ButtonLink href={ROUTES.register} variant={result.tier === "no" ? "paper" : "ink"}>
                      {result.tier === "no" ? "Baribir bepul sinab ko‘rish" : "Bepul boshlash"} <Arrow />
                    </ButtonLink>
                    <button
                      type="button"
                      onClick={() => setAnswers({})}
                      className="label underline decoration-[3px] underline-offset-4 hover:bg-ink hover:text-paper"
                    >
                      Qaytadan
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
