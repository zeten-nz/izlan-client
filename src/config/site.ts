/** Sayt bo‘yicha umumiy ma’lumotlar. Metadata, SEO va footer shu yerdan oladi. */
export const SITE = {
  name: "Izlan",
  domain: "izlan.uz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://izlan.uz",
  tagline: "O‘zingiz o‘rganing. Yo‘lni biz ko‘rsatamiz.",
  description:
    "Izlan — mustaqil o‘rganish platformasi. Bilimingizni aniqlaydi, shaxsiy yo‘l xaritasi tuzadi, dars va mashqlar bilan o‘rgatadi, xatolaringizni tushuntiradi.",
  locale: "uz_UZ",
  /** Footer uchun yil. new Date() Next cacheComponents rejimida prerender paytida xato beradi. */
  year: 2026,
} as const;
