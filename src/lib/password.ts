/** Parol siyosati (server bilan bir xil): kamida 8 belgi, katta harf, kichik harf, raqam. */
export const PASSWORD_RULES = [
  { id: "len", label: "Kamida 8 ta belgi", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Katta harf (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "Kichik harf (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "digit", label: "Raqam (0-9)", test: (p: string) => /\d/.test(p) },
] as const;

export const isPasswordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export const STRENGTH_LEVELS = ["Juda zaif", "Zaif", "O'rtacha", "Kuchli", "Juda kuchli"] as const;

/** 0..4. Siyosatga javob bermagan parol hech qachon "Kuchli"dan past emas deb ko'rsatilmaydi: 2 dan oshmaydi. */
export function passwordStrength(p: string): number {
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (p.length >= 16) score++;
  if (/^(.)\1+$/.test(p) || /^(password|12345678|qwerty)/i.test(p)) score = Math.min(score, 1);
  let level = Math.min(4, Math.max(0, score - 1));
  if (!isPasswordValid(p)) level = Math.min(level, 2);
  return p.length < 8 ? Math.min(level, 1) : level;
}
