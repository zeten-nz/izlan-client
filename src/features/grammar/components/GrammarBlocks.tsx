import type { PublicTranslation } from "@/lib/grammar/public-data";
import { RubyText } from "./RubyText";

type Block = PublicTranslation["blocks"][number];

/** Jadval gorizontal aylanadi (mobil), birinchi ustun yopishqoq. Sarlavhalar `scope` bilan belgilanadi. */
function Scroll({ caption, meta, children }: { caption?: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className="mt-6 first:mt-0">
      {(caption || meta) && (
        <figcaption className="label mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {caption}
          {meta}
        </figcaption>
      )}
      <div
        className="overflow-x-auto border-[3px] border-ink bg-white shadow-[4px_4px_0_0_var(--color-ink)]"
        tabIndex={0}
        role="region"
        aria-label={caption ?? "Jadval"}
      >
        <table className="w-full min-w-[480px] border-collapse text-left text-base">{children}</table>
      </div>
    </figure>
  );
}

const GENDER_LABEL = { m: ["erkak jinsi", "мужской"], f: ["ayol jinsi", "женский"], n: ["o‘rta jinsi", "средний"] } as const;

function declensionMeta(block: Extract<Block, { kind: "declension" }>, lang: string) {
  if (!block.gender && !block.word) return null;
  return (
    <span className="normal-case tracking-normal">
      {block.word && <span lang={lang} className="font-bold">{block.word}</span>}
      {block.gender && (
        <span className="ml-2 border-[3px] border-ink bg-bubble px-1.5 py-0.5">
          {GENDER_LABEL[block.gender][0]} (<span lang="ru">{GENDER_LABEL[block.gender][1]}</span>)
        </span>
      )}
    </span>
  );
}

const TH = "border-b-[3px] border-ink bg-ink px-3 py-2 label text-paper";
const TD = "border-b border-ink/25 px-3 py-2.5 align-top";
const STICKY = "sticky left-0 bg-paper-2 font-bold";

export function GrammarBlock({ block, lang }: { block: Block; lang: string }) {
  switch (block.kind) {
    case "table":
      return (
        <Scroll caption={block.caption}>
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i} scope="col" className={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row" className={`${TD} ${STICKY}`}>{cell}</th>
                  ) : (
                    <td key={c} className={TD}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </Scroll>
      );
    case "conjugation":
      return (
        <Scroll caption={block.caption}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Shakl</th>
              <th scope="col" className={TH}>Qiymat</th>
            </tr>
          </thead>
          <tbody>
            {block.forms.map((f, i) => (
              <tr key={i}>
                <th scope="row" className={`${TD} ${STICKY}`}>{f.label}</th>
                <td className={TD}>
                  {f.ruby ? <RubyText segments={f.ruby} lang={lang} /> : <span lang={lang}>{f.value}</span>}
                  {f.reading && <span lang={lang} className="ml-2 text-sm text-ink/60">({f.reading})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </Scroll>
      );
    case "declension":
      return (
        <Scroll caption={block.caption} meta={declensionMeta(block, lang)}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Kelishik</th>
              <th scope="col" className={TH}>Birlik</th>
              <th scope="col" className={TH}>Ko‘plik</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>
                <th scope="row" className={`${TD} ${STICKY}`}>{r.case}</th>
                <td className={TD}><span lang={lang}>{r.singular}</span></td>
                <td className={TD}><span lang={lang}>{r.plural}</span></td>
              </tr>
            ))}
          </tbody>
        </Scroll>
      );
  }
}
