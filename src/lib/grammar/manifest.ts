// Build manifest va "ommaga chiqarish" qoidasi. Sof modul.
// Manifest repo'da saqlanadi (content/grammar/manifest.json): ID'lar o'chirilmaganini tekshirish va keyingi
// bosqichda server publish tekshiruvi uchun asos. Vaqt belgisi yo'q: natija deterministik.
import type { Corpus, Rule, Translation } from "./corpus.ts";
import type { Manifest } from "./schema.ts";

export function buildManifest(c: Corpus): Manifest {
  const rules = [...c.rules]
    .sort((a, b) => a.meta.id.localeCompare(b.meta.id))
    .map((r) => ({
      id: r.meta.id,
      lang: r.meta.lang,
      slug: r.meta.slug,
      category: r.meta.category,
      ...(r.meta.level ? { level: r.meta.level } : {}),
      translations: [...r.translations]
        .sort((a, b) => a.lang.localeCompare(b.lang))
        .map((t) => ({
          lang: t.lang,
          status: t.data.status,
          revision: t.data.revision,
          contentHash: t.contentHash,
          ...(t.data.status === "approved" ? { reviewedBy: t.data.review.reviewedBy } : {}),
        })),
    }));
  const redirects = [...(c.redirects?.redirects ?? [])].sort(
    (a, b) => a.lang.localeCompare(b.lang) || a.from.localeCompare(b.from),
  );
  const retired = [...(c.redirects?.retired ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  return { schemaVersion: 1, rules, redirects, retired };
}

export function serializeManifest(m: Manifest): string {
  return JSON.stringify(m, null, 2) + "\n";
}

/** Faqat `approved` va yoqilgan tildagi tarjimalar ommaga chiqishi mumkin. Draft/review hech qachon. */
export function publicTranslations(c: Corpus): { rule: Rule; translation: Translation }[] {
  const out: { rule: Rule; translation: Translation }[] = [];
  for (const rule of c.rules) {
    if (!c.languages?.languages[rule.meta.lang]?.enabled) continue;
    for (const translation of rule.translations) {
      if (translation.data.status === "approved") out.push({ rule, translation });
    }
  }
  return out;
}

/** Eski slug → ID → joriy slug. Topilmasa null. */
export function resolveSlug(m: Manifest, lang: string, slug: string): { id: string; slug: string; redirected: boolean } | null {
  const live = m.rules.find((r) => r.lang === lang && r.slug === slug);
  if (live) return { id: live.id, slug: live.slug, redirected: false };
  const rd = m.redirects.find((r) => r.lang === lang && r.from === slug);
  if (!rd) return null;
  const target = m.rules.find((r) => r.id === rd.id);
  return target ? { id: target.id, slug: target.slug, redirected: true } : null;
}
