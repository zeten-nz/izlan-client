"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Sticker } from "@/components/ui/Sticker";

/** Xato chegaralari (error.tsx) uchun umumiy ko'rinish. Texnik tafsilot foydalanuvchiga ko'rsatilmaydi. */
export function ErrorState({
  error,
  retry,
  homeHref,
  homeLabel = "Bosh sahifa",
}: {
  error: unknown;
  retry: () => void;
  homeHref: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    // Kelajakda error tracking (Sentry va h.k.) shu yerga ulanadi
    console.error(error);
  }, [error]);

  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";

  return (
    <section role="alert" className="mx-auto max-w-[900px] px-4 py-16 sm:px-8 md:py-24">
      <Sticker tone="tomato" rotate={-3}>
        Xatolik
      </Sticker>
      <h1 className="display-cond mt-6 text-[clamp(32px,5vw,60px)]">Nimadir noto&apos;g&apos;ri ketdi</h1>
      <p className="mt-4 max-w-lg text-xl leading-snug">
        Sahifani yuklab bo&apos;lmadi. Qayta urinib ko&apos;ring — progressingiz saqlangan.
      </p>
      {digest && <p className="label mt-3 text-ink/60">Kod: {digest}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="label inline-flex min-h-11 items-center border-[3px] border-ink bg-acid px-4 py-2 shadow-[4px_4px_0_0_var(--color-ink)] focus-visible:outline-[3px] focus-visible:outline-cobalt"
        >
          Qayta urinish
        </button>
        <Link
          href={homeHref}
          className="label inline-flex min-h-11 items-center border-[3px] border-ink bg-white px-4 py-2 shadow-[4px_4px_0_0_var(--color-ink)] focus-visible:outline-[3px] focus-visible:outline-cobalt"
        >
          {homeLabel}
        </Link>
      </div>
    </section>
  );
}
