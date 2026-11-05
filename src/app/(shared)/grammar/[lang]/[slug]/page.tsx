import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { RouteLoading } from "@/components/loader/RouteLoading";
import { Sticker } from "@/components/ui/Sticker";
import { Crumbs } from "@/features/grammar/components/Crumbs";
import { RuleSections, sectionLinks } from "@/features/grammar/components/RuleSections";
import { grammarMetadata } from "@/features/grammar/seo";
import { grammarHref } from "@/config/routes";
import { getGrammar } from "@/lib/grammar/data";
import { parseBackTarget } from "@/lib/grammar/back";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const grammar = await getGrammar().catch(() => null);
  const rule = grammar?.rule(lang, slug);
  const language = grammar?.language(lang);
  if (!grammar || !rule || !language) return grammarMetadata({ title: "Sahifa topilmadi", description: "" });
  const { t } = grammar.translation(rule);
  return grammarMetadata({ title: `${t.title} — ${language.name} grammatikasi`, description: t.summary });
}

/** URL parametrlari (params) so'rov vaqtida o'qiladi, shuning uchun Suspense ichida (Cache Components). */
export default function RulePage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <RuleContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RuleContent({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  const back = parseBackTarget(await searchParams);
  const grammar = await getGrammar();

  const rule = grammar.rule(lang, slug);
  if (!rule) {
    // Eski slug bo'lsa doimiy ID orqali joriy manzilga (proxy odatda buni 308 bilan oldindan hal qiladi).
    const target = grammar.redirectTarget(lang, slug);
    if (target && target.lang === lang) permanentRedirect(grammarHref(lang, target.slug));
    notFound();
  }
  const language = grammar.language(lang);
  if (!language) notFound();

  const { lang: explLang, t } = grammar.translation(rule);
  const toc = sectionLinks(t);
  const categoryTitle = language.categories.find((c) => c.id === rule.category)?.title[explLang] ?? rule.category;
  const related = rule.related
    .map((id) => grammar.ruleById(id))
    .flatMap((r) => (r && r.lang === lang ? [{ rule: r, title: grammar.translation(r, explLang).t.title }] : []));

  return (
    <article>
      {back ? (
        <nav aria-label="Darsga qaytish" className="border-b-[3px] border-ink bg-acid">
          <div className="mx-auto max-w-[1480px] px-4 py-2.5 md:px-8">
            <Link
              href={back.href}
              data-testid="grammar-back"
              className="label inline-flex min-h-11 items-center border-[3px] border-ink bg-white px-4 py-2 shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-paper"
            >
              ← {back.label}
            </Link>
          </div>
        </nav>
      ) : null}
      <header className="relative isolate overflow-hidden border-b-[3px] border-ink">
        <div className="bg-dots pointer-events-none absolute inset-0 -z-10 opacity-20" aria-hidden />
        <div className="mx-auto max-w-[1480px] px-4 py-10 md:px-8 md:py-16">
          <Crumbs
            items={[
              { label: "Grammatika", href: grammarHref() },
              { label: language.name, href: grammarHref(lang) },
              { label: t.title },
            ]}
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {rule.level && (
              <Sticker tone="acid" rotate={-2}>
                {rule.level.confirmed ? "" : "≈ "}
                {rule.level.system.toUpperCase()} · {rule.level.value}
                {rule.level.confirmed ? "" : " (taxminiy)"}
              </Sticker>
            )}
            <span className="label border-[3px] border-ink bg-white px-2 py-1">{categoryTitle}</span>
          </div>
          <h1 className="display mt-5 break-words text-[clamp(36px,7vw,96px)]">{t.title}</h1>
          <p className="mt-5 max-w-3xl text-xl leading-snug md:text-2xl">{t.summary}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-10 px-4 py-10 md:px-8 md:py-14 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <RuleSections t={t} lang={lang} />
        </div>

        <aside className="space-y-8 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
          {toc.length > 1 && (
            <nav aria-label="Sahifa mazmuni" className="border-[3px] border-ink bg-white p-4">
              <p className="label mb-3">Mazmun</p>
              <ul className="space-y-1.5">
                {toc.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block min-h-9 py-1 text-lg font-bold underline decoration-[3px] decoration-acid underline-offset-4 hover:bg-acid">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {related.length > 0 && (
            <nav aria-label="Bog‘liq qoidalar" className="border-[3px] border-ink bg-sky p-4">
              <p className="label mb-3">Bog‘liq qoidalar</p>
              <ul className="space-y-1.5">
                {related.map(({ rule: r, title }) => (
                  <li key={r.id}>
                    <Link href={grammarHref(r.lang, r.slug)} className="block min-h-9 py-1 text-lg font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <p className="label text-ink/60">
            Tushuntirish tili: {explLang.toUpperCase()} · tahrir {t.revision}
          </p>
        </aside>
      </div>
    </article>
  );
}
