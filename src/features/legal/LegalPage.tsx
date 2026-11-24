import type { ReactNode } from "react";
import { Sticker } from "@/components/ui/Sticker";

/**
 * Huquqiy hujjat sahifasi. DRAFT=true ekan, sahifa tepasida "yurist tasdiqlamagan loyiha" ogohlantirishi turadi
 * va metadata'da noindex. Yurist tasdiqlagach: matn yangilanadi, DRAFT=false, server LEGAL_VERSION yangilanadi.
 */
export const LEGAL_DRAFT = true;

/** To'ldirilishi shart bo'lgan rekvizitlar — real qiymatlarsiz productionga chiqarilmaydi. */
export const PLACEHOLDER = (what: string) => (
  <mark className="bg-tomato/30 px-1 font-semibold" title="To'ldirilishi kerak">
    [{what}]
  </mark>
);

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[820px] px-4 py-12 sm:px-8 sm:py-16">
      {LEGAL_DRAFT && (
        <div role="note" className="mb-8 border-[3px] border-ink bg-tomato/20 p-4 shadow-[4px_4px_0_0_var(--color-ink)]">
          <p className="label">Loyiha</p>
          <p className="mt-1 font-semibold">
            Bu matn yurist tomonidan hali tasdiqlanmagan loyiha. Kvadrat qavsdagi joylar ([…]) real rekvizitlar bilan to&apos;ldirilishi kerak.
          </p>
        </div>
      )}
      <Sticker tone="acid" rotate={-2}>
        Huquqiy
      </Sticker>
      <h1 className="display mt-6 text-[clamp(32px,6vw,64px)] [overflow-wrap:anywhere]">{title}</h1>
      <p className="label mt-3 text-ink/75">Tahrir: {updated}</p>
      <div className="mt-10 space-y-8 text-lg leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:leading-tight [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-3 [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
