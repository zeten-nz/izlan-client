import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { SECTIONS } from "@/config/routes";
import { FAQ } from "../content/copy";

/** Savol-javob. <details name="faq"> bilan: JS kerak emas, bittasi ochilsa boshqasi yopiladi. */
export function Faq() {
  return (
    <section id={SECTIONS.faq} className="relative border-b-[3px] border-ink">
      <div className="mx-auto grid max-w-[1480px] gap-14 px-4 py-24 md:px-8 md:py-36 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead
            index="07"
            kicker="Savollar"
            title={
              <>
                Ochiq <span className="serif-i text-cobalt">javoblar</span>
              </>
            }
            lead="Qiyin savollardan qochmaymiz. Izlan nima qila olishini ham, nima qila olmasligini ham yozdik."
          />
        </Reveal>

        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.03} y={20}>
              <details
                name="faq"
                open={i === 0}
                className="group border-[3px] border-ink bg-paper shadow-[5px_5px_0_0_var(--color-ink)] open:bg-acid"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-bold md:p-6 md:text-xl [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    className="grid size-9 shrink-0 place-items-center border-[3px] border-ink bg-paper transition-transform duration-200 group-open:rotate-45 group-open:bg-ink group-open:text-acid"
                    aria-hidden
                  >
                    <svg viewBox="0 0 16 16" className="size-4">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  </span>
                </summary>
                <p className="border-t-[3px] border-ink px-5 py-5 text-[17px] leading-relaxed md:px-6">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
