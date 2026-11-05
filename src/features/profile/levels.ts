import type { LevelInfo } from "./types";

/**
 * Faqat server `xp.level` bermagan (eski javob) holat uchun xavfsiz boshlang'ich ko'rinish.
 * Daraja qoidalari BACKEND siyosatida (server/src/xp/xp.policy.ts); bu yerda hisoblanmaydi.
 */
export const levelFallback = (): LevelInfo => ({
  level: 1,
  title: "Yangi izlanuvchi",
  minTotalXp: 0,
  nextLevel: null,
  nextTitle: null,
  nextMinTotalXp: null,
  progressPct: 0,
  xpToNext: 0,
  isMax: false,
});
