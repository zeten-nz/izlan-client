// Qidiruv va filtr: sof funksiyalar (client va server uchun). Indeks build'da tayyor ma'lumotdan quriladi.
// Strategiya: oddiy "barcha so'zlar topilishi shart" + og'irlikli moslik; matn `foldForSearch` bilan
// kanonik shaklga keltiriladi (urg'u, ё/е, kana, NFC/NFD, apostrof). Katta dataset bo'lmaguncha engine kerak emas.
import type { PublicRule } from "./public-data.ts";
import { foldForSearch } from "./text.ts";

export type IndexEntry = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  /** Ko'rsatish uchun, masalan "A2" yoki "N5"; daraja yo'q bo'lsa undefined. */
  level?: string;
  /** Daraja metodist tomonidan tasdiqlanganmi (false/undefined → "taxminiy" deb ko'rsatiladi). */
  levelConfirmed?: boolean;
  /** Qo'shimcha qidiruv so'zlari (slug so'zlari, eski slug'lar, kalit so'zlar — turli yozuvlarda). */
  terms: string;
};

/** Eski nom (testlar va tashqi kod uchun): `foldForSearch` bilan bir xil. */
export const normalize = foldForSearch;

export function toIndexEntry(rule: PublicRule, explanationLang: string, oldSlugs: string[] = []): IndexEntry | null {
  const t = rule.translations[explanationLang];
  if (!t) return null;
  return {
    id: rule.id,
    slug: rule.slug,
    title: t.title,
    summary: t.summary,
    category: rule.category,
    level: rule.level?.value,
    levelConfirmed: rule.level?.confirmed === true,
    terms: [rule.slug.replace(/-/g, " "), ...oldSlugs.map((s) => s.replace(/-/g, " ")), ...t.keywords].join(" "),
  };
}

type Folded = { title: string; titleWords: string[]; terms: string; summary: string };
const cache = new WeakMap<IndexEntry, Folded>();
function folded(e: IndexEntry): Folded {
  let f = cache.get(e);
  if (!f) {
    const title = foldForSearch(e.title);
    f = { title, titleWords: title.split(" "), terms: foldForSearch(e.terms), summary: foldForSearch(e.summary) };
    cache.set(e, f);
  }
  return f;
}

function score(e: IndexEntry, tokens: string[]): number {
  const f = folded(e);
  let total = 0;
  for (const tok of tokens) {
    let s = 0;
    if (f.title.startsWith(tok)) s = 100;
    else if (f.titleWords.some((w) => w.startsWith(tok))) s = 80;
    else if (f.title.includes(tok)) s = 60; // yapon: bo'shliqsiz matnda ichki moslik
    else if (f.terms.includes(tok)) s = 40;
    else if (f.summary.includes(tok)) s = 20;
    if (s === 0) return 0; // barcha so'zlar topilishi shart
    total += s;
  }
  return total;
}

export function search(entries: readonly IndexEntry[], query: string): IndexEntry[] {
  const tokens = foldForSearch(query).split(" ").filter(Boolean);
  if (!tokens.length) return [...entries];
  return entries
    .map((e) => ({ e, s: score(e, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.title.localeCompare(b.e.title))
    .map((x) => x.e);
}

export type Filters = { q: string; category: string | null; level: string | null };

export function filterEntries(entries: readonly IndexEntry[], f: Filters): IndexEntry[] {
  return search(entries, f.q).filter((e) => (!f.category || e.category === f.category) && (!f.level || e.level === f.level));
}
