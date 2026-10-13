/**
 * TARIFLAR. DIQQAT: bu qiymatlar VAQTINCHALIK (placeholder).
 * TODO(pricing): real narx va limitlar biznes tomonidan tasdiqlangach shu yerda o‘zgartiring;
 * landing komponentlari faqat shu faylni o‘qiydi.
 */
export type Plan = {
  id: "free" | "pro" | "max";
  name: string;
  /** so‘mda, oyiga. 0 = bepul */
  priceUzs: number;
  tagline: string;
  /** "Kimga mos" */
  fitFor: string;
  features: readonly string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
};

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Boshlang‘ich",
    priceUzs: 0,
    tagline: "Tanishib ko‘rish uchun",
    fitFor: "Hali ikkilanayotganlar. Testni topshirib, Izlan sizga mosligini o‘zingiz ko‘ring.",
    features: [
      "Darajani aniqlash testi",
      "Yo‘l xaritasini ko‘rish",
      "Har kuni cheklangan mashqlar",
      "Asosiy progress",
    ],
    cta: "Bepul boshlash",
  },
  {
    id: "pro",
    name: "Izlanuvchi",
    priceUzs: 59_000,
    tagline: "Har kuni o‘qiydiganlar uchun",
    fitFor: "Kuniga 15–30 daqiqa ajrata oladigan va natija ko‘rmoqchi bo‘lganlar.",
    features: [
      "Cheklovsiz dars va mashqlar",
      "Xatolar tahlili va qayta o‘rgatish",
      "Har kunlik shaxsiy reja",
      "Mavzu bo‘yicha to‘liq progress",
      "XP va IZL mukofotlari",
    ],
    cta: "Izlanuvchini tanlash",
    highlight: true,
    badge: "Ko‘pchilik tanlaydi",
  },
  {
    id: "max",
    name: "Chuqur",
    priceUzs: 119_000,
    tagline: "Jiddiy maqsadlar uchun",
    fitFor: "Tez va chuqur o‘rganmoqchi bo‘lganlar, yangi imkoniyatlarni birinchi bo‘lib olishni istaganlar.",
    features: [
      "Izlanuvchidagi hamma narsa",
      "Yangi fanlar va imkoniyatlarga ilk kirish",
      "Chuqur progress hisobotlari",
      "Ustuvor qo‘llab-quvvatlash",
    ],
    cta: "Chuqurni tanlash",
  },
];

/** IZL bilan obuna to‘lovidan qoplanishi mumkin bo‘lgan eng katta ulush (backend siyosati: 20%). */
export const MAX_IZL_DISCOUNT_PERCENT = 20;

export function formatPriceUzs(value: number) {
  return value === 0 ? "0" : value.toLocaleString("ru-RU").replace(/ /g, " ");
}
