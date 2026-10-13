import Image from "next/image";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { Sticker } from "@/components/ui/Sticker";
import { Tilt } from "@/components/ui/Tilt";
import { ROUTES, SECTIONS, sectionHref } from "@/config/routes";
import { RotatingBadge } from "../components/RotatingBadge";
import { TICKER } from "../content/copy";

const PLAN_ITEMS = [
  { label: "Verb “to be”", meta: "5 mashq", done: true },
  { label: "Tinglash", meta: "3 mashq", done: true },
  { label: "Xatolar takrori", meta: "2 mashq", done: false },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-x-clip border-b-[3px] border-ink">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      {/* Fon shakllari */}
      <div className="pointer-events-none absolute -top-24 right-[-8%] size-[520px] rounded-full bg-cobalt" aria-hidden />
      <div
        className="pointer-events-none absolute bottom-[-210px] left-[-90px] size-[320px] rotate-12 border-[3px] border-ink bg-bubble"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1480px] items-center gap-14 px-4 pb-20 pt-10 md:px-8 md:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pb-28">
        {/* ── Matn ── */}
        <div>
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Sticker tone="paper" rotate={-2}>
              Mustaqil o‘rganish platformasi
            </Sticker>
            <Sticker tone="tomato" rotate={2}>
              Ingliz tili A1 dan boshlandi
            </Sticker>
          </div>

          <h1 className="display text-[clamp(44px,7.4vw,118px)]">
            <span className="block">O‘zingiz</span>
            <span className="relative mt-2 inline-block -rotate-1 bg-ink px-3 py-1 text-acid md:px-5 md:py-2">
              o‘rganing.
            </span>
            <span className="serif-i mt-4 block text-[0.62em] leading-[0.95] normal-case text-cobalt">
              yo‘lni biz ko‘rsatamiz.
            </span>
          </h1>

          <p className="mt-9 max-w-xl text-xl leading-snug md:text-2xl">
            Izlan videodarslar ombori emas. U avval <b className="bg-acid px-1">bilimingizni aniqlaydi</b>, keyin sizga
            shaxsiy yo‘l xaritasi tuzadi, xatolaringizni tushuntiradi va natijangizga qarab keyingi qadamni o‘zgartiradi.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 md:gap-6">
            <ButtonLink href={ROUTES.register} size="lg" variant="acid">
              Bepul boshlash <Arrow />
            </ButtonLink>
            <ButtonLink href={sectionHref(SECTIONS.fit)} size="lg" variant="paper">
              Menga mosmi?
            </ButtonLink>
          </div>
          <p className="label mt-6 text-ink/70">Bepul tarif mavjud · Avval test, keyin qaror</p>
        </div>

        {/* ── 3D kollaj ── */}
        <div className="perspective relative mx-auto w-full max-w-[520px] lg:max-w-none">
          <Tilt max={7} className="relative aspect-[4/5] w-full">
            {/* orqa karta: kafel naqshi */}
            <div
              className="absolute -right-3 top-6 h-[78%] w-[78%] rotate-6 overflow-hidden border-[3px] border-ink shadow-hard"
              style={{ transform: "translateZ(0px) rotate(6deg)" }}
            >
              <Image
                src="/images/bukhara-tilework.webp"
                alt=""
                fill
                sizes="(min-width:1024px) 30vw, 70vw"
                className="object-cover"
              />
            </div>

            {/* asosiy karta: Gur-i Amir gumbazi */}
            <div
              className="absolute left-0 top-0 h-[88%] w-[74%] -rotate-3 overflow-hidden border-[3px] border-ink bg-sky shadow-[10px_10px_0_0_var(--color-ink)]"
              style={{ transform: "translateZ(40px) rotate(-3deg)" }}
            >
              <Image
                src="/images/samarkand-gur-emir-dome.webp"
                alt="Samarqanddagi Go‘ri Amir maqbarasining zumrad gumbazi"
                fill
                priority
                sizes="(min-width:1024px) 28vw, 60vw"
                className="object-cover"
              />
              <span className="label absolute bottom-0 left-0 bg-ink px-2.5 py-1.5 text-paper">Samarqand</span>
            </div>

            {/* suzana kartochkasi */}
            <div
              className="absolute bottom-[2%] right-[4%] h-[34%] w-[34%] rotate-[8deg] overflow-hidden border-[3px] border-ink shadow-hard-sm"
              style={{ transform: "translateZ(70px) rotate(8deg)" }}
            >
              <Image src="/images/bukhara-suzani.webp" alt="" fill sizes="20vw" className="object-cover" />
            </div>

            {/* Reja kartasi (interfeys) */}
            <div
              className="absolute -left-2 bottom-[6%] w-[72%] md:w-[62%] border-[3px] border-ink bg-paper p-4 shadow-[6px_6px_0_0_var(--color-ink)] md:-left-8"
              style={{ transform: "translateZ(100px)" }}
            >
              <p className="label mb-3 flex items-center justify-between">
                Bugungi reja <span className="bg-acid px-1.5">A1</span>
              </p>
              <ul className="space-y-2">
                {PLAN_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-3 text-[15px] font-bold">
                    <span
                      className={`grid size-5 shrink-0 place-items-center border-[3px] border-ink ${it.done ? "bg-ink text-acid" : "bg-paper"}`}
                      aria-hidden
                    >
                      {it.done && (
                        <svg viewBox="0 0 12 12" className="size-3">
                          <path d="M2 6.5l2.6 2.6L10 3" fill="none" stroke="currentColor" strokeWidth="2.4" />
                        </svg>
                      )}
                    </span>
                    <span className={it.done ? "line-through decoration-2" : ""}>{it.label}</span>
                    <span className="label ml-auto font-normal text-ink/60">{it.meta}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* XP yulduzi */}
            <div className="absolute -top-6 left-[50%] size-32 md:size-40" style={{ transform: "translateZ(140px)" }}>
              <div
                className="grid size-full animate-wobble place-items-center bg-tomato"
                style={{ clipPath: "polygon(50% 0%,61% 20%,82% 11%,79% 34%,100% 41%,83% 57%,95% 78%,72% 76%,65% 100%,50% 83%,35% 100%,28% 76%,5% 78%,17% 57%,0% 41%,21% 34%,18% 11%,39% 20%)" }}
              >
                <span className="display text-lg leading-none text-ink md:text-xl">+120 XP</span>
              </div>
            </div>
          </Tilt>

          <RotatingBadge
            text="BEPUL BOSHLANG"
            center="↗"
            className="absolute -bottom-8 -right-2 z-10 md:-right-6"
          />
        </div>
      </div>

      <Marquee
        items={TICKER}
        className="display relative border-t-[3px] border-ink bg-ink py-4 text-[clamp(24px,3.4vw,44px)] text-paper"
      />
    </section>
  );
}
