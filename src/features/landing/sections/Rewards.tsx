import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Sticker } from "@/components/ui/Sticker";
import { MAX_IZL_DISCOUNT_PERCENT } from "@/config/pricing";
import { Coin3D } from "../components/Coin3D";

/** XP va IZL: motivatsiya tizimi. Chegirma haqida faqat rejalashtirilgan deb yoziladi. */
export function Rewards() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-ink bg-cobalt text-paper">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden style={{ filter: "invert(1)" }} />
      <div className="relative mx-auto grid max-w-[1480px] items-center gap-16 px-4 py-24 md:px-8 md:py-36 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <SectionHead
              tone="light"
              index="05"
              kicker="Motivatsiya"
              title={
                <>
                  O‘qigan sari<br />
                  <span className="mt-3 inline-block bg-acid px-3 pb-1 text-ink">yutasiz</span>
                </>
              }
              lead="Boshlash oson, davom ettirish qiyin. Shuning uchun Izlan har bir qadamni hisobga oladi va mukofotlaydi."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <Reveal delay={0.05}>
              <div className="h-full border-[3px] border-ink bg-paper p-6 text-ink shadow-[6px_6px_0_0_var(--color-ink)]">
                <Sticker tone="acid" rotate={-3}>
                  XP
                </Sticker>
                <h3 className="display-cond mt-4 text-4xl">Tajriba ballari</h3>
                <p className="mt-2 leading-snug">Har bir bajarilgan mashq va dars uchun beriladi. Doimiy o‘qiganingiz ko‘rinib turadi.</p>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="h-full border-[3px] border-ink bg-paper p-6 text-ink shadow-[6px_6px_0_0_var(--color-ink)]">
                <Sticker tone="tomato" rotate={3}>
                  IZL
                </Sticker>
                <h3 className="display-cond mt-4 text-4xl">Natija uchun tanga</h3>
                <p className="mt-2 leading-snug">
                  Haqiqiy o‘zlashtirish uchun beriladi. IZL ni obuna to‘lovining {MAX_IZL_DISCOUNT_PERCENT}% igacha
                  qismini qoplashga ishlatish rejalashtirilgan.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1} className="relative grid place-items-center py-10">
          <div className="absolute size-[110%] max-w-[480px] rounded-full border-[3px] border-dashed border-paper/40 animate-spin-slow" aria-hidden />
          <Coin3D />
          <Sticker tone="paper" rotate={-6} className="absolute bottom-4 left-2 md:left-10">
            Tez orada: IZL bilan chegirma
          </Sticker>
        </Reveal>
      </div>
    </section>
  );
}
