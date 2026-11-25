import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Faqat lupa belgisi (kichik joylar uchun) */
  markOnly?: boolean;
  /** Eski API bilan moslik: yangi logo och va qorong'i fonda bir xil ko'rinadi (qora kontur + krem harflar). */
  tone?: "dark" | "light";
};

/**
 * Yagona brend logosi: Instagram logosidagi harflar va lupa, lekin bir qatorda — "i" ning nuqtasi lupa, ZLAN bilan bir balandlikda.
 * Fayllar public/brand/ da: logo-full.svg (lupa + IZLAN), logo-lens.svg (faqat lupa).
 * Barcha joylar shu komponent orqali — logoni almashtirish uchun faqat shu faylni o'zgartirish yetadi.
 */
export function Logo({ className, markOnly = false }: Props) {
  return (
    <span className={cn("inline-flex items-center select-none", className)}>
      {markOnly ? (
        // eslint-disable-next-line @next/next/no-img-element -- statik SVG, optimizatsiya kerak emas
        <img src="/brand/logo-lens.svg" alt="" width={40} height={40} className="size-10" />
      ) : (
        // Bir qatorli logo: "i" nuqtasi = katta lupa, ZLAN ~7% pastroq; nisbat ~2.6
        // eslint-disable-next-line @next/next/no-img-element -- statik SVG, optimizatsiya kerak emas
        <img src="/brand/logo-full.svg" alt="" width={114} height={44} className="h-11 w-auto" />
      )}
      <span className="sr-only">Izlan</span>
    </span>
  );
}
