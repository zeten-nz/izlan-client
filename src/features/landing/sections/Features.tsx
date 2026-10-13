import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { SECTIONS } from "@/config/routes";
import { cn } from "@/lib/cn";
import { FeatureIcon } from "../components/FeatureIcon";
import { FEATURES } from "../content/copy";

type FeatureId = (typeof FEATURES)[number]["id"];

/** Bento panjara: har bir kartaning joyi va rangi shu yerda. */
const LAYOUT: Record<FeatureId, { span: string; tone: string; image?: { src: string; alt: string } }> = {
  placement: {
    span: "lg:col-span-4",
    tone: "bg-acid",
    image: { src: "/images/study-hand.webp", alt: "Daftarga yozayotgan qo‘l" },
  },
  roadmap: { span: "lg:col-span-2", tone: "bg-paper" },
  formats: { span: "lg:col-span-2", tone: "bg-bubble" },
  mistakes: { span: "lg:col-span-2", tone: "bg-tomato" },
  daily: { span: "lg:col-span-2", tone: "bg-sky" },
  honest: {
    span: "lg:col-span-6",
    tone: "bg-ink text-paper",
    image: { src: "/images/bukhara-tilework.webp", alt: "Buxorodagi kafel naqshi" },
  },
};

export function Features() {
  return (
    <section id={SECTIONS.features} className="relative border-b-[3px] border-ink">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-36">
        <Reveal>
          <SectionHead
            index="03"
            kicker="Imkoniyatlar"
            title={
              <>
                Nima qilib<br />
                <span className="mt-3 inline-block bg-ink px-3 pb-1 text-acid">beradi</span>
              </>
            }
            lead="Har bir imkoniyat bitta maqsadga xizmat qiladi: siz haqiqatan o‘rganganingizni ko‘rishingiz va keyingi qadamni bilishingiz uchun."
          />
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-6 lg:gap-6">
          {FEATURES.map((f, i) => {
            const l = LAYOUT[f.id];
            const dark = f.id === "honest";
            return (
              <Reveal key={f.id} delay={(i % 3) * 0.07} className={cn("h-full md:col-span-1", l.span)}>
                <article
                  className={cn(
                    "group relative flex h-full min-h-64 flex-col justify-between overflow-hidden border-[3px] border-ink p-6 shadow-[6px_6px_0_0_var(--color-ink)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-[0.6deg] md:p-8",
                    l.tone,
                    l.image && "lg:min-h-80",
                  )}
                >
                  {l.image && (
                    <div
                      className={cn(
                        "absolute inset-y-0 right-0 hidden w-[42%] border-l-[3px] border-ink lg:block",
                        dark ? "opacity-90" : "",
                      )}
                    >
                      <Image src={l.image.src} alt={l.image.alt} fill sizes="35vw" className="img-mono object-cover" />
                      <div className={cn("absolute inset-0 mix-blend-multiply", dark ? "bg-acid" : "bg-cobalt")} />
                    </div>
                  )}

                  <div className={cn("relative", l.image && "lg:max-w-[52%]")}>
                    <FeatureIcon id={f.id} className="size-12" />
                    <h3 className="display-cond mt-6 text-[clamp(32px,3.6vw,52px)]">{f.title}</h3>
                    <p className={cn("mt-3 max-w-md text-lg leading-snug", dark ? "text-paper/85" : "text-ink/85")}>
                      {f.text}
                    </p>
                  </div>

                  <span className="label relative mt-6 self-end opacity-60">
                    {String(i + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
