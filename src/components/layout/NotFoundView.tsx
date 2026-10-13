"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { ROUTES, SECTIONS, UPCOMING_ROUTES, sectionHref } from "@/config/routes";

/**
 * 404 ko‘rinishi. Agar foydalanuvchi hali yaratilmagan, lekin rejalashtirilgan
 * sahifaga (Login/Register) kelgan bo‘lsa, xato emas, "tez orada" xabari chiqadi.
 * Sahifalar tayyor bo‘lgach UPCOMING_ROUTES dan olib tashlash kifoya.
 */
export function NotFoundView() {
  const pathname = usePathname();
  // Statik 404 serverda haqiqiy yo‘lni bilmaydi: hydration mos kelishi uchun mount'dan keyin aniqlaymiz.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const upcoming = mounted && UPCOMING_ROUTES.includes(pathname);
  const isRegister = pathname === ROUTES.register;

  return (
    <section className="relative isolate overflow-hidden border-b-[3px] border-ink">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 size-[420px] rounded-full bg-acid" aria-hidden />

      <div className="mx-auto grid min-h-[calc(100vh-var(--header-h))] max-w-[1480px] items-center gap-10 px-4 py-16 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Sticker tone={upcoming ? "acid" : "tomato"} rotate={-3}>
            {upcoming ? "Tez orada" : "Xato 404"}
          </Sticker>

          <p className="display mt-6 text-[clamp(100px,16vw,250px)] leading-[0.75] [-webkit-text-stroke:4px_var(--color-ink)] text-transparent">
            {upcoming ? "Soon" : "404"}
          </p>

          <h1 className="display-cond mt-8 text-[clamp(36px,5vw,72px)]">
            {upcoming
              ? isRegister
                ? "Ro‘yxatdan o‘tish hali ochilmagan"
                : "Kirish sahifasi hali ochilmagan"
              : "Bunday sahifa topilmadi"}
          </h1>
          <p className="mt-4 max-w-lg text-xl leading-snug">
            {upcoming
              ? "Platforma ustida ishlayapmiz. Tayyor bo‘lishi bilan shu tugma ishlaydi. Hozircha Izlan bilan tanishib chiqing."
              : "Havola eskirgan bo‘lishi yoki manzil noto‘g‘ri yozilgan bo‘lishi mumkin. Bosh sahifadan davom eting."}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href={ROUTES.home} size="lg" variant="acid">
              Bosh sahifaga <Arrow />
            </ButtonLink>
            {upcoming && (
              <ButtonLink href={sectionHref(SECTIONS.fit)} size="lg" variant="paper">
                Menga mosmi?
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="relative hidden aspect-square max-h-[520px] lg:block" aria-hidden>
          <div className="absolute inset-[8%] animate-wobble border-[3px] border-ink bg-ink shadow-[12px_12px_0_0_var(--color-cobalt)]">
            <div className="grid h-full place-items-center">
              <span className="display text-[160px] text-acid">i?</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
