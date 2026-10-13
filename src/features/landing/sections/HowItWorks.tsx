import type { ReactNode } from "react";
import { SectionHead } from "@/components/ui/SectionHead";
import { SECTIONS } from "@/config/routes";
import { cn } from "@/lib/cn";
import { LessonVisual, MistakeVisual, ProgressVisual, RoadmapVisual, TestVisual } from "../components/StepVisuals";
import { STEPS } from "../content/copy";

const VISUALS: Record<(typeof STEPS)[number]["id"], ReactNode> = {
  test: <TestVisual />,
  roadmap: <RoadmapVisual />,
  lesson: <LessonVisual />,
  mistakes: <MistakeVisual />,
  progress: <ProgressVisual />,
};

const TONES: Record<(typeof STEPS)[number]["id"], string> = {
  test: "bg-acid",
  roadmap: "bg-sky",
  lesson: "bg-bubble",
  mistakes: "bg-tomato",
  progress: "bg-paper",
};

/** 5 qadamli jarayon. Kartalar sticky: skroll qilganda bir-birining ustiga yig‘iladi. */
export function HowItWorks() {
  return (
    <section id={SECTIONS.how} className="relative border-b-[3px] border-ink bg-paper-2">
      <div className="mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-36">
        <SectionHead
          index="02"
          kicker="Qanday ishlaydi"
          title={
            <>
              Besh qadam.<br />
              <span className="serif-i inline-block pl-2 text-cobalt">Bitta yo‘l.</span>
            </>
          }
          lead="Siz “nima o‘qisam ekan” deb o‘ylab vaqt yo‘qotmaysiz. Izlan har bir qadamda keyingisini tayyorlab qo‘yadi."
        />

        <ol className="mt-16 md:mt-24">
          {STEPS.map((step, i) => (
            <li
              key={step.id}
              className="sticky pb-6 md:pb-10"
              style={{ top: `calc(var(--header-h) + ${i * 14 + 12}px)` }}
            >
              <article
                className={cn(
                  "grid items-center gap-8 border-[3px] border-ink p-6 shadow-[8px_8px_0_0_var(--color-ink)] md:grid-cols-[1.1fr_1fr] md:gap-14 md:p-12",
                  TONES[step.id],
                )}
              >
                <div>
                  <p className="display text-[clamp(72px,12vw,180px)] leading-[0.8] [-webkit-text-stroke:3px_var(--color-ink)] text-transparent">
                    {step.n}
                  </p>
                  <h3 className="display-cond mt-4 text-[clamp(36px,5vw,68px)]">{step.title}</h3>
                  <p className="mt-4 max-w-md text-lg font-medium leading-snug md:text-xl">{step.text}</p>
                </div>
                <div className="flex justify-center md:justify-end">
                  <div className={cn("w-full max-w-sm", i % 2 ? "rotate-2" : "-rotate-2")}>{VISUALS[step.id]}</div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
