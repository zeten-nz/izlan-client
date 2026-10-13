import Image from "next/image";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Sticker } from "@/components/ui/Sticker";
import { ROUTES, SECTIONS, sectionHref } from "@/config/routes";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-tomato">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-15" aria-hidden />

      {/* Dekorativ rasmlar */}
      <div
        className="absolute -right-10 top-10 hidden h-[360px] w-[280px] rotate-6 overflow-hidden border-[3px] border-ink shadow-[8px_8px_0_0_var(--color-ink)] lg:block"
        aria-hidden
      >
        <Image src="/images/bukhara-samanid.webp" alt="" fill sizes="280px" className="object-cover" />
      </div>
      <div
        className="absolute bottom-10 right-[22%] hidden h-[200px] w-[260px] -rotate-6 overflow-hidden border-[3px] border-ink shadow-[8px_8px_0_0_var(--color-ink)] xl:block"
        aria-hidden
      >
        <Image src="/images/bukhara-ark.webp" alt="" fill sizes="260px" className="object-cover" />
      </div>

      <div className="relative mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-40">
        <Reveal>
          <Sticker tone="paper" rotate={-3}>
            Birinchi qadam bepul
          </Sticker>
          <h2 className="display mt-8 max-w-5xl text-[clamp(48px,9vw,148px)]">
            Birinchi qadam <span className="serif-i">—</span> test.
          </h2>
          <p className="mt-8 max-w-xl text-xl font-medium leading-snug md:text-2xl">
            Qolganini yo‘l xaritasi hal qiladi. Bir necha daqiqa ajrating va qaerda turganingizni o‘z ko‘zingiz bilan ko‘ring.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-5">
            <ButtonLink href={ROUTES.register} size="lg" variant="ink">
              Ro‘yxatdan o‘tish <Arrow />
            </ButtonLink>
            <ButtonLink href={sectionHref(SECTIONS.fit)} size="lg" variant="paper">
              Avval maslahat
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
