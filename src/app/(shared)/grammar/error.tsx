"use client";

import { Sticker } from "@/components/ui/Sticker";

/**
 * Grammatika xizmati yoki kill-switch (overlay) holati olinmasa (fail-closed): kontent ko'rsatilmaydi.
 * Dars ichidagi havolalar serverda hal qilinadi va bu sahifaga bog'liq emas.
 */
export default function GrammarError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-[900px] px-4 py-16 md:px-8 md:py-24" role="alert">
      <Sticker tone="tomato" rotate={-3}>Vaqtincha</Sticker>
      <h1 className="display-cond mt-6 text-[clamp(32px,5vw,60px)]">Grammatika hozircha mavjud emas</h1>
      <p className="mt-4 max-w-lg text-xl leading-snug">Bir ozdan keyin qayta urinib ko‘ring. Darslaringiz va progressingiz saqlangan.</p>
      <button
        type="button"
        onClick={reset}
        className="label mt-8 inline-flex min-h-11 items-center border-[3px] border-ink bg-acid px-4 py-2 shadow-[4px_4px_0_0_var(--color-ink)]"
      >
        Qayta urinish
      </button>
    </section>
  );
}
