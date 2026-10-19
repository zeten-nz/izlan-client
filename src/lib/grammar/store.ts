// Ommaviy ma'lumot ustidan o'qish funksiyalari (sof, test qilinadi). `data.ts` ularni haqiqiy fayl bilan bog'laydi.
import type { PublicData, PublicRule, PublicTranslation } from "./public-data.ts";
import { toIndexEntry, type IndexEntry } from "./search.ts";

/** Tushuntirish tili: hozircha faqat o'zbekcha. Keyin foydalanuvchi sozlamasidan olinadi. */
export const DEFAULT_EXPLANATION_LANG = "uz";

export function createStore(data: PublicData) {
  const langs = new Map(data.languages.map((l) => [l.code, l]));
  const rulesByLang = new Map<string, PublicRule[]>();
  for (const r of data.rules) {
    if (!langs.has(r.lang)) continue;
    (rulesByLang.get(r.lang) ?? rulesByLang.set(r.lang, []).get(r.lang)!).push(r);
  }
  const byId = new Map(data.rules.map((r) => [r.id, r]));
  const retiredById = new Map(data.retired.map((t) => [t.id, t]));

  /** Berilgan tushuntirish tilida bor bo'lmasa, o'zbekchaga, keyin mavjud birinchisiga tushadi. */
  function translation(rule: PublicRule, preferred = DEFAULT_EXPLANATION_LANG): { lang: string; t: PublicTranslation } {
    const order = [preferred, DEFAULT_EXPLANATION_LANG, ...Object.keys(rule.translations)];
    for (const l of order) if (rule.translations[l]) return { lang: l, t: rule.translations[l] };
    throw new Error(`Qoidada tarjima yo'q: ${rule.id}`);
  }

  return {
    languages: () => data.languages,
    language: (code: string) => langs.get(code) ?? null,
    rules: (lang: string): PublicRule[] => rulesByLang.get(lang) ?? [],
    ruleById: (id: string) => byId.get(id) ?? null,
    rule(lang: string, slug: string): PublicRule | null {
      return rulesByLang.get(lang)?.find((r) => r.slug === slug) ?? null;
    },
    /** Eski slug bo'lsa joriy qoidani qaytaradi. */
    redirectTarget(lang: string, slug: string): PublicRule | null {
      const rd = data.redirects.find((r) => r.lang === lang && r.from === slug);
      return rd ? (byId.get(rd.id) ?? null) : null;
    },
    translation,
    /**
     * Doimiy ID bo'yicha: jonli qoida → o'zi; nafaqaga chiqarilgan → almashtiruvchi (agar ommaviy bo'lsa); aks holda null.
     * Dars havolalari shu orqali slug o'zgarsa ham, ID nafaqaga chiqsa ham buzilmaydi.
     */
    resolveId(id: string): PublicRule | null {
      const live = byId.get(id);
      if (live) return live;
      const t = retiredById.get(id);
      return t?.replacedBy ? (byId.get(t.replacedBy) ?? null) : null;
    },
    index(lang: string, explanationLang = DEFAULT_EXPLANATION_LANG): IndexEntry[] {
      const entries: IndexEntry[] = [];
      for (const r of rulesByLang.get(lang) ?? []) {
        const olds = data.redirects.filter((x) => x.id === r.id).map((x) => x.from);
        const e = toIndexEntry(r, translation(r, explanationLang).lang, olds);
        if (e) entries.push(e);
      }
      return entries.sort((a, b) => a.title.localeCompare(b.title));
    },
    /** Sitemap va generateStaticParams uchun. */
    allRules: () => data.rules,
  };
}
export type GrammarStore = ReturnType<typeof createStore>;
