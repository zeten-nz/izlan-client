import { cacheLife } from "next/cache";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Sticker } from "@/components/ui/Sticker";
import { ROUTES, SECTIONS } from "@/config/routes";
import { cn } from "@/lib/cn";
import { formatUzs } from "@/lib/money";

type PublicCourse = {
  id: string;
  slug: string;
  kind: "LANGUAGE" | "SUBJECT";
  title: string;
  description: string;
  monthlyPriceUzs: number | null;
  levels: string[];
  accessDays: number;
};

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000";

/** Narxlar admin'da o'zgaradi — kesh 1 daqiqada yangilanadi (cacheComponents rejimi). */
async function loadCourses(): Promise<PublicCourse[] | null> {
  "use cache";
  cacheLife("minutes");
  try {
    const res = await fetch(`${API_URL}/api/public/prices`);
    if (!res.ok) return null;
    return (await res.json()) as PublicCourse[];
  } catch {
    return null;
  }
}

const HOW = [
  { n: "01", t: "Balansni to‘ldiring", d: "Saytning o‘zida — summani tanlaysiz, kartaga o‘tkazasiz. Pul bir necha daqiqada avtomatik tushadi." },
  { n: "02", t: "Kursni tanlang", d: "Faqat o‘zingizga kerak kursni oling. Boshqasiga pul to‘lamaysiz." },
  { n: "03", t: "30 kun o‘qing", d: "Muddat tugasa — balansdan bir bosishda uzaytirasiz. Avtomatik yechilmaydi." },
] as const;

function CourseCard({ c, i }: { c: PublicCourse; i: number }) {
  const free = c.monthlyPriceUzs === null;
  const levels = c.levels.length > 1 ? `${c.levels[0]}–${c.levels[c.levels.length - 1]}` : (c.levels[0] ?? "");
  return (
    <article
      className={cn(
        "relative flex h-full flex-col border-[3px] border-ink p-7 md:p-8",
        i === 0 ? "bg-acid shadow-[10px_10px_0_0_var(--color-ink)]" : "bg-paper shadow-[6px_6px_0_0_var(--color-ink)]",
      )}
    >
      {levels && (
        <Sticker tone={i === 0 ? "paper" : "acid"} rotate={4} className="absolute -top-4 right-4">
          {levels}
        </Sticker>
      )}
      <p className="label text-ink/70">{c.kind === "LANGUAGE" ? "Til" : "Fan"}</p>
      <h3 className="display-cond mt-1 text-4xl">{c.title}</h3>
      <p className="mt-2 text-ink/75">{c.description}</p>

      <p className="mt-8 flex flex-wrap items-baseline gap-x-2">
        <span className="display whitespace-nowrap text-[clamp(40px,4.2vw,60px)] leading-none">{free ? "Bepul" : formatUzs(c.monthlyPriceUzs!)}</span>
        {!free && <span className="label whitespace-nowrap">so‘m / {c.accessDays} kun</span>}
      </p>

      <ul className="mt-6 space-y-3 border-t-[3px] border-ink pt-6 text-[15px] font-medium leading-snug">
        <li>✦ Har darajaning birinchi mavzusi — bepul</li>
        <li>✦ Barcha darslar, mashqlar va mavzu testlari</li>
        <li>✦ Grammatika kutubxonasi va daftar</li>
      </ul>

      <div className="mt-auto pt-9">
        <ButtonLink href={ROUTES.register} variant={i === 0 ? "ink" : "acid"} className="w-full">
          Bepul boshlash <Arrow />
        </ButtonLink>
      </div>
    </article>
  );
}

/** Narxlar: bitta qimmat obuna o'rniga — har kurs alohida, arzon, oylik. Ma'lumot serverdan (admin belgilaydi). */
export async function Prices() {
  const courses = await loadCourses();
  return (
    <section id={SECTIONS.prices} className="relative border-b-[3px] border-ink bg-paper-2">
      <div className="mx-auto max-w-[1480px] px-4 py-24 md:px-8 md:py-36">
        <Reveal>
          <SectionHead
            index="06"
            kicker="Narxlar"
            title={
              <>
                Faqat keragi<br />
                <span className="serif-i text-tomato">uchun</span> to‘lang.
              </>
            }
            lead="Bitta qimmat obuna yo‘q. Har bir kurs alohida, oylik va arzon. Birinchi mavzular bepul — avval sinab ko‘ring."
          />
        </Reveal>

        {courses && courses.length > 0 ? (
          <div className="mt-20 grid items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {courses.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.08} className="h-full">
                <CourseCard c={c} i={i} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-16 border-[3px] border-ink bg-paper p-6 text-lg font-medium shadow-[6px_6px_0_0_var(--color-ink)]">
            Kurs narxlari tez orada e’lon qilinadi. Hozir ro‘yxatdan o‘tib, bepul mavzulardan boshlashingiz mumkin.
          </p>
        )}

        <Reveal className="mt-16">
          <div className="border-[3px] border-ink bg-ink p-6 text-paper md:p-10">
            <p className="label mb-6 text-acid">Qanday to‘lanadi?</p>
            <div className="grid gap-6 md:grid-cols-3">
              {HOW.map((h) => (
                <div key={h.n} className="border-l-[6px] border-acid pl-4">
                  <p className="label text-acid">{h.n}</p>
                  <p className="display-cond text-3xl">{h.t}</p>
                  <p className="mt-2 text-paper/80">{h.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
