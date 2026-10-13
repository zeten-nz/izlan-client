import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { CONTRASTS } from "../content/copy";

/** "Izlan nima emas" bo‘limi: odatiy yondashuv va Izlan farqi. */
export function Contrast() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink bg-ink text-paper">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden style={{ filter: "invert(1)" }} />

      <div className="relative mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-36">
        <Reveal>
          <SectionHead
            tone="light"
            index="01"
            kicker="Farq nimada"
            title={
              <>
                Kurslar bozori <span className="serif-i text-acid">emas.</span>
                <br />
                Shaxsiy yo‘l-yo‘riq.
              </>
            }
            lead="Internetda dars ko‘p. Qiyini, o‘zingizga keraklisini tanlash va to‘g‘ri tartibda o‘qish. Izlan aynan shu qismini o‘z zimmasiga oladi."
          />
        </Reveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
          <ul className="space-y-5">
            {CONTRASTS.map((row, i) => (
              <Reveal key={row.izlan} delay={i * 0.06} y={24}>
                <li className="grid overflow-hidden border-[3px] border-paper md:grid-cols-2">
                  <div className="relative border-b-[3px] border-paper p-6 md:border-b-0 md:border-r-[3px]">
                    <p className="label mb-3 text-paper/50">Odatdagidek</p>
                    <p className="text-lg text-paper/55 line-through decoration-tomato decoration-[3px]">{row.other}</p>
                  </div>
                  <div className="bg-acid p-6 text-ink">
                    <p className="label mb-3">Izlanda</p>
                    <p className="text-lg font-bold leading-snug">{row.izlan}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1} className="relative hidden lg:block">
            <div className="sticky top-28 rotate-2 border-[3px] border-paper bg-paper p-3 shadow-[10px_10px_0_0_var(--color-acid)]">
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src="/images/study-writing.webp"
                  alt="Daftarga yozayotgan o‘quvchi"
                  fill
                  sizes="340px"
                  className="img-mono object-cover"
                />
                <div className="absolute inset-0 bg-cobalt mix-blend-multiply" />
              </div>
              <p className="label mt-3 text-ink">Fig. 01 — o‘z tezligingizda</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
