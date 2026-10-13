import { ButtonLink, Arrow } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Sticker } from "@/components/ui/Sticker";
import { PLANS, formatPriceUzs, type Plan } from "@/config/pricing";
import { ROUTES, SECTIONS } from "@/config/routes";
import { cn } from "@/lib/cn";

const GUIDE = [
  { when: "Hali ikkilanyapsizmi?", then: "Boshlang‘ich bilan testni topshiring. Qaror keyin." },
  { when: "Har kuni o‘qimoqchimisiz?", then: "Izlanuvchi sizga yetadi. Ko‘pchilik shuni tanlaydi." },
  { when: "Tez va chuqur kerakmi?", then: "Chuqur: yangi imkoniyatlarga birinchi kirasiz." },
] as const;

function PlanCard({ plan }: { plan: Plan }) {
  const free = plan.priceUzs === 0;
  return (
    <article
      className={cn(
        "relative flex h-full flex-col border-[3px] border-ink p-7 md:p-8",
        plan.highlight
          ? "bg-acid shadow-[10px_10px_0_0_var(--color-ink)] lg:-translate-y-5"
          : "bg-paper shadow-[6px_6px_0_0_var(--color-ink)]",
      )}
    >
      {plan.badge && (
        <Sticker tone="tomato" rotate={4} className="absolute -top-4 right-4">
          {plan.badge}
        </Sticker>
      )}

      <h3 className="display-cond text-4xl">{plan.name}</h3>
      <p className="mt-1 text-ink/70">{plan.tagline}</p>

      <p className="mt-8 flex flex-wrap items-baseline gap-x-2">
        <span className="display whitespace-nowrap text-[clamp(40px,4.2vw,64px)] leading-none">{formatPriceUzs(plan.priceUzs)}</span>
        <span className="label whitespace-nowrap">so‘m{free ? "" : " / oy"}</span>
      </p>

      <p className="mt-6 border-l-[6px] border-ink pl-3 text-[15px] leading-snug">
        <b>Kimga mos:</b> {plan.fitFor}
      </p>

      <ul className="mt-6 space-y-3 border-t-[3px] border-ink pt-6">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 font-medium leading-snug">
            <span className="mt-1 grid size-5 shrink-0 place-items-center border-[3px] border-ink bg-ink text-acid" aria-hidden>
              <svg viewBox="0 0 12 12" className="size-3">
                <path d="M2 6.5l2.6 2.6L10 3" fill="none" stroke="currentColor" strokeWidth="2.4" />
              </svg>
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-9">
        <ButtonLink href={ROUTES.register} variant={plan.highlight ? "ink" : "acid"} className="w-full">
          {plan.cta} <Arrow />
        </ButtonLink>
      </div>
    </article>
  );
}

export function Pricing() {
  return (
    <section id={SECTIONS.pricing} className="relative border-b-[3px] border-ink bg-paper-2">
      <div className="mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-36">
        <Reveal>
          <SectionHead
            index="06"
            kicker="Tariflar"
            title={
              <>
                Oylik.<br />
                <span className="serif-i text-tomato">Oddiy.</span> Ochiq.
              </>
            }
            lead="Narxlar so‘mda, bir oy uchun. Bepul tarifdan boshlab, Izlan sizga mosligiga ishonch hosil qilgach, qaror qiling."
          />
        </Reveal>

        <div className="mt-20 grid items-stretch gap-8 lg:grid-cols-3 lg:gap-7">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.08} className="h-full">
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        {/* Maslahat bloki */}
        <Reveal className="mt-16">
          <div className="border-[3px] border-ink bg-ink p-6 text-paper md:p-10">
            <p className="label mb-6 text-acid">Qaysi birini tanlash kerak?</p>
            <div className="grid gap-6 md:grid-cols-3">
              {GUIDE.map((g) => (
                <div key={g.when} className="border-l-[6px] border-acid pl-4">
                  <p className="display-cond text-3xl">{g.when}</p>
                  <p className="mt-2 text-paper/80">{g.then}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
