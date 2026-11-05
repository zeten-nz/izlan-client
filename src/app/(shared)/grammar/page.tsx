import Link from "next/link";
import { Suspense } from "react";
import { Crumbs } from "@/features/grammar/components/Crumbs";
import { grammarMetadata } from "@/features/grammar/seo";
import { grammarHref } from "@/config/routes";
import { Sticker } from "@/components/ui/Sticker";
import { getGrammar } from "@/lib/grammar/data";

export const metadata = grammarMetadata({
  title: "Grammatika kutubxonasi",
  description: "Grammatik qoidalar: tushuntirish, formulalar, misollar, istisnolar va ko‘p uchraydigan xatolar.",
});

/** Tillar ro'yxati: runtime ma'lumot (release rejimida API'dan), shuning uchun Suspense ichida; qobiq (hero) oldindan tayyor. */
async function Languages() {
  const grammar = await getGrammar();
  const languages = grammar.languages().map((l) => ({ ...l, count: grammar.rules(l.code).length }));
  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {languages.map((l) => (
          <li key={l.code}>
            <Link
              href={grammarHref(l.code)}
              className="group block h-full border-[3px] border-ink bg-white p-5 shadow-[6px_6px_0_0_var(--color-ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--color-ink)]"
            >
              <span className="label text-ink/60">{l.code.toUpperCase()}</span>
              <span className="display-cond mt-2 block text-4xl" lang={l.code}>{l.nativeName}</span>
              <span className="mt-2 block text-lg">{l.name} grammatikasi</span>
              <span className="label mt-5 inline-block border-[3px] border-ink bg-acid px-2 py-1">
                {l.count > 0 ? `${l.count} ta qoida` : "Tez orada"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {languages.length === 0 && (
        <p className="border-[3px] border-ink bg-white p-6 text-lg">Hozircha tillar mavjud emas.</p>
      )}
    </>
  );
}

export default function GrammarHome() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b-[3px] border-ink">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -top-20 -z-10 size-[320px] rounded-full bg-acid" aria-hidden />
        <div className="mx-auto max-w-[1480px] px-4 py-12 md:px-8 md:py-20">
          <Crumbs items={[{ label: "Grammatika" }]} />
          <Sticker tone="acid" rotate={-2} className="mt-8">Bepul bo‘lim</Sticker>
          <h1 className="display mt-6 text-[clamp(44px,9vw,128px)]">Grammatika kutubxonasi</h1>
          <p className="mt-6 max-w-2xl text-xl leading-snug">
            Qoidani qayta eslang yoki yangisini o‘rganing. Har bir qoidada tushuntirish, formula, misollar, istisnolar va
            ko‘p uchraydigan xatolar bor.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-12 md:px-8 md:py-16" aria-labelledby="languages-h">
        <h2 id="languages-h" className="display-cond mb-6 text-[clamp(28px,4vw,48px)]">Tilni tanlang</h2>
        <Suspense fallback={<p role="status" className="label border-[3px] border-ink bg-white p-4">Yuklanmoqda...</p>}>
          <Languages />
        </Suspense>
      </section>
    </>
  );
}
