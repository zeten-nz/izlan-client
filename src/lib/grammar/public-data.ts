// Ommaviy ma'lumot: build vaqtida korpusdan FAQAT `approved` tarjimalar ajratib olinadi.
// draft/review kontent bu faylga hech qachon tushmaydi, shuning uchun client yoki serverga yetib bormaydi.
import { z } from "zod";
import type { Corpus } from "./corpus.ts";
import { publicTranslations } from "./manifest.ts";
import { exampleSchema, sourceSchema, translationSchema } from "./schema.ts";

type ApprovedFields = Extract<z.infer<typeof translationSchema>, { status: "approved" }>;

const publicTranslationSchema = z.object({
  title: z.string(),
  summary: z.string(),
  revision: z.number(),
  reviewedAt: z.string(),
  /** Tekshirgan shaxs (reviewers.json'dagi ism). */
  reviewedByName: z.string(),
  formulas: z.array(z.object({ label: z.string(), pattern: z.string(), note: z.string().optional() })),
  examples: z.array(exampleSchema),
  exceptions: z.array(z.object({ title: z.string(), body: z.string() })),
  commonMistakes: z.array(z.object({ wrong: z.string(), right: z.string(), explanation: z.string() })),
  blocks: translationSchema.options[2].shape.blocks,
  keywords: z.array(z.string()),
  sources: z.array(sourceSchema),
  body: z.string(),
});

export const publicDataSchema = z.object({
  schemaVersion: z.literal(1),
  languages: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      nativeName: z.string(),
      dir: z.enum(["ltr", "rtl"]),
      levelSystem: z.enum(["cefr", "jlpt", "none"]),
      scripts: z.array(z.string()),
      categories: z.array(z.object({ id: z.string(), title: z.record(z.string(), z.string()) })),
    }),
  ),
  rules: z.array(
    z.object({
      id: z.string(),
      lang: z.string(),
      slug: z.string(),
      category: z.string(),
      level: z.object({ system: z.enum(["cefr", "jlpt"]), value: z.string(), confirmed: z.boolean().optional() }).optional(),
      related: z.array(z.string()),
      /** Tushuntirish tili → tarjima. */
      translations: z.record(z.string(), publicTranslationSchema),
    }),
  ),
  redirects: z.array(z.object({ lang: z.string(), from: z.string(), id: z.string() })),
  /** Nafaqaga chiqarilgan ID'lar; `replacedBy` faqat ommaviy (approved) qoidaga ishora qiladi. */
  retired: z.array(z.object({ id: z.string(), replacedBy: z.string().nullable() })),
});
export type PublicData = z.infer<typeof publicDataSchema>;
export type PublicRule = PublicData["rules"][number];
export type PublicTranslation = PublicRule["translations"][string];

export function buildPublicData(c: Corpus): PublicData {
  const approved = publicTranslations(c);
  const byRule = new Map<string, typeof approved>();
  for (const a of approved) {
    const list = byRule.get(a.rule.meta.id) ?? [];
    list.push(a);
    byRule.set(a.rule.meta.id, list);
  }
  const publicIds = new Set(byRule.keys());
  const reviewerNames = new Map((c.reviewers?.reviewers ?? []).map((r) => [r.id, r.name]));

  const rules: PublicRule[] = [...byRule.values()]
    .map((list) => {
      const { meta } = list[0].rule;
      const translations: PublicRule["translations"] = {};
      for (const { translation } of [...list].sort((a, b) => a.translation.lang.localeCompare(b.translation.lang))) {
        const d = translation.data as ApprovedFields;
        translations[translation.lang] = {
          title: d.title,
          summary: d.summary,
          revision: d.revision,
          reviewedAt: d.review.reviewedAt,
          reviewedByName: reviewerNames.get(d.review.reviewedBy) ?? d.review.reviewedBy,
          formulas: d.formulas,
          examples: d.examples,
          exceptions: d.exceptions,
          commonMistakes: d.commonMistakes,
          blocks: d.blocks,
          keywords: d.keywords ?? [],
          sources: d.sources ?? [],
          body: translation.body,
        };
      }
      return {
        id: meta.id,
        lang: meta.lang,
        slug: meta.slug,
        category: meta.category,
        ...(meta.level ? { level: meta.level } : {}),
        related: meta.related.filter((id) => publicIds.has(id)).sort(),
        translations,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const languages = Object.entries(c.languages?.languages ?? {})
    .filter(([, l]) => l.enabled)
    .map(([code, l]) => ({
      code,
      name: l.name,
      nativeName: l.nativeName,
      dir: l.dir,
      levelSystem: l.levelSystem,
      scripts: l.scripts,
      categories: l.categories,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const redirects = (c.redirects?.redirects ?? [])
    .filter((r) => publicIds.has(r.id))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.from.localeCompare(b.from));

  const retired = (c.redirects?.retired ?? [])
    .map((t) => ({ id: t.id, replacedBy: t.replacedBy && publicIds.has(t.replacedBy) ? t.replacedBy : null }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return { schemaVersion: 1, languages, rules, redirects, retired };
}

export const serializePublicData = (d: PublicData) => JSON.stringify(d, null, 2) + "\n";
