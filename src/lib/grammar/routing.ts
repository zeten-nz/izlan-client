// /grammar/** yo'llari uchun qaror: ruxsat / eski slug → 308 / 404. Sof funksiya (proxy.ts ishlatadi, test qilinadi).
// Nega kerak: Cache Components'da noma'lum param birinchi so'rovda 200 (soft 404) bilan stream bo'ladi va har bir noma'lum
// URL kesh yozuvi yaratadi. Proxy'da hal qilinsa, haqiqiy 404/308 qaytadi va noma'lum yo'llar renderga yetmaydi.
import { RULE_ID_RE } from "./ids.ts";
import type { GrammarStore } from "./store.ts";

export type RouteDecision = { kind: "pass" } | { kind: "redirect"; to: string } | { kind: "notFound" };

export function decideGrammarRoute(pathname: string, store: GrammarStore): RouteDecision {
  const parts = pathname.split("/").filter(Boolean); // ["grammar", lang?, slug?, ...]
  if (parts[0] !== "grammar") return { kind: "pass" };
  if (parts.length === 1) return { kind: "pass" };
  if (parts.length > 3) return { kind: "notFound" };

  const [, lang, slug] = parts;
  if (!store.language(lang)) return { kind: "notFound" };
  if (parts.length === 2) return { kind: "pass" };

  if (store.rule(lang, slug)) return { kind: "pass" };
  // Darslardan kelgan doimiy ID: /grammar/en/gr_en_000001 → joriy slug (yoki almashtiruvchi qoida)
  if (RULE_ID_RE.test(slug)) {
    const rule = store.resolveId(slug);
    return rule ? { kind: "redirect", to: `/grammar/${rule.lang}/${rule.slug}` } : { kind: "notFound" };
  }
  const target = store.redirectTarget(lang, slug);
  if (target && target.lang === lang) return { kind: "redirect", to: `/grammar/${lang}/${target.slug}` };
  return { kind: "notFound" };
}
