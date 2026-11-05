import type { ReactNode } from "react";
import type { PublicTranslation } from "@/lib/grammar/public-data";
import { FuriganaScope } from "./FuriganaScope";
import { GrammarBlock } from "./GrammarBlocks";
import { RubyText } from "./RubyText";
import { SafeMarkdown } from "./SafeMarkdown";

export const SECTION_IDS = {
  explanation: "tushuntirish",
  formulas: "formulalar",
  tables: "jadvallar",
  examples: "misollar",
  exceptions: "istisnolar",
  mistakes: "xatolar",
  sources: "manbalar",
} as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-12 scroll-mt-[calc(var(--header-h)+16px)] first:mt-0">
      <h2 id={`${id}-h`} className="display-cond mb-5 border-b-[3px] border-ink pb-2 text-[clamp(28px,4vw,44px)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Qoida sahifasining mazmuni. Faqat `approved` kontent (public data) keladi. `lang` — o'rganilayotgan til. */
export function RuleSections({ t, lang }: { t: PublicTranslation; lang: string }) {
  const has = {
    body: t.body.trim().length > 0,
    formulas: t.formulas.length > 0,
    blocks: t.blocks.length > 0,
    examples: t.examples.length > 0,
    exceptions: t.exceptions.length > 0,
    mistakes: t.commonMistakes.length > 0,
    sources: t.sources.length > 0,
  };
  const hasRuby =
    t.examples.some((e) => e.ruby) || t.blocks.some((b) => b.kind === "conjugation" && b.forms.some((f) => f.ruby));

  const content = (
    <div>
      {has.body && (
        <Section id={SECTION_IDS.explanation} title="Tushuntirish">
          <SafeMarkdown source={t.body} />
        </Section>
      )}

      {has.formulas && (
        <Section id={SECTION_IDS.formulas} title="Formulalar">
          <ul className="grid gap-4 md:grid-cols-2">
            {t.formulas.map((f, i) => (
              <li key={i} className="border-[3px] border-ink bg-white p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                <p className="label mb-2">{f.label}</p>
                <p className="break-words font-mono text-[15px] font-bold" lang={lang}>{f.pattern}</p>
                {f.note && <p className="mt-2 text-base text-ink/75">{f.note}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {has.blocks && (
        <Section id={SECTION_IDS.tables} title="Jadvallar">
          {t.blocks.map((b, i) => (
            <GrammarBlock key={i} block={b} lang={lang} />
          ))}
        </Section>
      )}

      {has.examples && (
        <Section id={SECTION_IDS.examples} title="Misollar">
          <ol className="space-y-4">
            {t.examples.map((e, i) => (
              <li key={i} className="border-[3px] border-ink bg-white p-4">
                <p className="text-xl font-bold leading-snug" lang={lang}>
                  {e.ruby ? <RubyText segments={e.ruby} lang={lang} /> : (e.stressed ?? e.text)}
                </p>
                {e.reading && !e.ruby && <p className="mt-1 text-base text-ink/60" lang={lang}>{e.reading}</p>}
                {e.romanization && <p className="mt-1 text-base italic text-ink/60" lang={`${lang}-Latn`}>{e.romanization}</p>}
                <p className="mt-2 text-lg">{e.translation}</p>
                {e.note && <p className="label mt-3 normal-case tracking-normal text-ink/70">{e.note}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {has.exceptions && (
        <Section id={SECTION_IDS.exceptions} title="Istisnolar">
          <ul className="space-y-4">
            {t.exceptions.map((x, i) => (
              <li key={i} className="border-[3px] border-ink bg-sky p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                <h3 className="font-display text-xl font-black leading-tight">{x.title}</h3>
                <p className="mt-2 text-lg">{x.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {has.mistakes && (
        <Section id={SECTION_IDS.mistakes} title="Ko‘p uchraydigan xatolar">
          <ul className="space-y-5">
            {t.commonMistakes.map((m, i) => (
              <li key={i} className="border-[3px] border-ink bg-white">
                <p className="flex flex-col gap-1 border-b-[3px] border-ink bg-tomato p-3 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="label shrink-0">✗ Xato</span>
                  <span className="text-lg font-bold line-through decoration-2" lang={lang}>{m.wrong}</span>
                </p>
                <p className="flex flex-col gap-1 border-b-[3px] border-ink bg-acid p-3 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="label shrink-0">✓ To‘g‘ri</span>
                  <span className="text-lg font-bold" lang={lang}>{m.right}</span>
                </p>
                <p className="p-3 text-base">{m.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {has.sources && (
        <Section id={SECTION_IDS.sources} title="Manbalar">
          <ul className="space-y-2 text-base">
            {t.sources.map((src, i) => (
              <li key={i}>
                {src.url ? (
                  <a href={src.url} rel="noopener noreferrer" target="_blank" className="font-bold underline decoration-[3px] decoration-acid underline-offset-4">
                    {src.title}
                  </a>
                ) : (
                  <span className="font-bold">{src.title}</span>
                )}
                {src.license && <span className="text-ink/70"> · {src.license}</span>}
                {src.note && <span className="block text-ink/70">{src.note}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
  return hasRuby ? <FuriganaScope>{content}</FuriganaScope> : content;
}

/** Sahifa ichidagi mazmun (TOC) uchun mavjud bo'limlar. */
export function sectionLinks(t: PublicTranslation): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  if (t.body.trim()) out.push({ id: SECTION_IDS.explanation, label: "Tushuntirish" });
  if (t.formulas.length) out.push({ id: SECTION_IDS.formulas, label: "Formulalar" });
  if (t.blocks.length) out.push({ id: SECTION_IDS.tables, label: "Jadvallar" });
  if (t.examples.length) out.push({ id: SECTION_IDS.examples, label: "Misollar" });
  if (t.exceptions.length) out.push({ id: SECTION_IDS.exceptions, label: "Istisnolar" });
  if (t.commonMistakes.length) out.push({ id: SECTION_IDS.mistakes, label: "Xatolar" });
  if (t.sources.length) out.push({ id: SECTION_IDS.sources, label: "Manbalar" });
  return out;
}
