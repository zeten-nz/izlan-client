import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RouteLoading } from "@/components/loader/RouteLoading";
import { Crumbs } from "@/features/grammar/components/Crumbs";
import { RuleBrowser } from "@/features/grammar/components/RuleBrowser";
import { grammarMetadata } from "@/features/grammar/seo";
import { grammarHref } from "@/config/routes";
import { getGrammar } from "@/lib/grammar/data";
import { LEVEL_VALUES } from "@/lib/grammar/schema";
import { DEFAULT_EXPLANATION_LANG } from "@/lib/grammar/store";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const grammar = await getGrammar().catch(() => null);
  const l = grammar?.language(lang);
  if (!l) return grammarMetadata({ title: "Sahifa topilmadi", description: "" });
  return grammarMetadata({
    title: `${l.name} grammatikasi`,
    description: `${l.name} tilining grammatik qoidalari: tushuntirish, formulalar, misollar va xatolar.`,
  });
}

/** URL parametri (params) so'rov vaqtida o'qiladi, shuning uchun Suspense ichida (Cache Components). */
export default function LanguagePage({ params }: Props) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <LanguageContent params={params} />
    </Suspense>
  );
}

async function LanguageContent({ params }: Props) {
  const { lang } = await params;
  const grammar = await getGrammar();
  const l = grammar.language(lang);
  if (!l) notFound();

  const entries = grammar.index(lang, DEFAULT_EXPLANATION_LANG);
  const categories = l.categories.map((c) => ({ id: c.id, title: c.title[DEFAULT_EXPLANATION_LANG] ?? c.id }));
  const order: readonly string[] = l.levelSystem === "none" ? [] : LEVEL_VALUES[l.levelSystem];
  const levels = [...new Set(entries.flatMap((e) => (e.level ? [e.level] : [])))].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );

  return (
    <>
      <section className="relative isolate overflow-hidden border-b-[3px] border-ink">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden />
        <div className="mx-auto max-w-[1480px] px-4 py-10 md:px-8 md:py-16">
          <Crumbs items={[{ label: "Grammatika", href: grammarHref() }, { label: l.name }]} />
          <h1 className="display mt-6 text-[clamp(40px,8vw,112px)]">{l.name} grammatikasi</h1>
          <p className="mt-4 max-w-2xl text-xl leading-snug">
            <span lang={lang}>{l.nativeName}</span> tilining qoidalari o‘zbek tilida tushuntirilgan.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-10 md:px-8 md:py-14">
        <RuleBrowser lang={lang} entries={entries} categories={categories} levels={levels} />
      </section>
    </>
  );
}
