// Server uchun grammatika qoidalari reyestri (Lesson Builder integratsiyasi).
// Client kontent repo'si ID'larning yagona manbai; server o'z nusxasini shu yerdan oladi:
//   npm run grammar:export-registry        → ../server/src/grammar/grammar-registry.data.ts
// Server faqat shu reyestrga ishonadi; `version` — mazmun xeshi (ikkala repo mosligini tekshirish uchun).
import { createHash } from "node:crypto";
import type { Corpus } from "./corpus.ts";

export const REGISTRY_SCHEMA_VERSION = 1;

export type RegistryRule = {
  id: string;
  lang: string;
  slug: string;
  category: string;
  level?: { system: "cefr" | "jlpt"; value: string; confirmed?: boolean };
  status: "approved" | "review" | "draft";
  title: string | null;
};
export type GrammarRegistry = {
  schemaVersion: 1;
  version: string;
  languages: { code: string; name: string; enabled: boolean }[];
  rules: RegistryRule[];
  retired: { id: string; replacedBy: string | null }[];
};

/** Server bilan bir xil kanonik serializatsiya (kalitlar tartiblangan). */
export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalize(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function computeVersion(d: Omit<GrammarRegistry, "version">): string {
  const { schemaVersion, languages, rules, retired } = d;
  return createHash("sha256").update(canonicalize({ schemaVersion, languages, rules, retired })).digest("hex").slice(0, 16);
}

const RANK = { approved: 2, review: 1, draft: 0 } as const;

export function buildRegistry(c: Corpus): GrammarRegistry {
  const languages = Object.entries(c.languages?.languages ?? {})
    .map(([code, l]) => ({ code, name: l.name, enabled: l.enabled }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const rules: RegistryRule[] = [...c.rules]
    .sort((a, b) => a.meta.id.localeCompare(b.meta.id))
    .map((r) => {
      // Rule holati: eng yuqori tarjima holati; sarlavha — approved tarjimadan (uz birinchi)
      const sorted = [...r.translations].sort((a, b) => RANK[b.data.status] - RANK[a.data.status] || (a.lang === "uz" ? -1 : 1));
      const best = sorted[0];
      const status = best ? best.data.status : "draft";
      const approved = r.translations.filter((t) => t.data.status === "approved");
      const titleSrc = approved.find((t) => t.lang === "uz") ?? approved[0];
      return {
        id: r.meta.id,
        lang: r.meta.lang,
        slug: r.meta.slug,
        category: r.meta.category,
        ...(r.meta.level
          ? { level: { system: r.meta.level.system, value: r.meta.level.value, ...(r.meta.level.confirmed !== undefined ? { confirmed: r.meta.level.confirmed } : {}) } }
          : {}),
        status,
        title: status === "approved" && titleSrc ? titleSrc.data.title : null,
      } satisfies RegistryRule;
    });

  const retired = [...(c.redirects?.retired ?? [])]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => ({ id: t.id, replacedBy: t.replacedBy ?? null }));

  const base = { schemaVersion: REGISTRY_SCHEMA_VERSION as 1, languages, rules, retired };
  return { schemaVersion: 1, version: computeVersion(base), languages, rules, retired };
}

export const serializeRegistry = (r: GrammarRegistry) => JSON.stringify(r, null, 2) + "\n";

/** Server repo'siga yoziladigan TS moduli (nest build uchun asset sozlamasi kerak emas). */
export function serverModuleSource(r: GrammarRegistry): string {
  return (
    "// AUTO-GENERATED: client repo'da `npm run grammar:export-registry` bilan yaratiladi. Qo'lda tahrirlamang.\n" +
    "// Manba: client/content/grammar. Reyestr versiyasi mazmun xeshi; server uni qayta hisoblab tekshiradi.\n" +
    "import type { GrammarRegistryData } from './registry';\n\n" +
    `export const GRAMMAR_REGISTRY_DATA: GrammarRegistryData = ${JSON.stringify(r, null, 2)};\n`
  );
}

// ───────── client ↔ server mosligi (deploy darvozasi)

/** Server repo'sidagi generatsiya qilingan moduldan reyestr ob'ektini ajratib oladi (TS faylni bajarmasdan). */
export function parseServerModule(source: string): GrammarRegistry | null {
  const m = /GRAMMAR_REGISTRY_DATA: GrammarRegistryData = (\{[\s\S]*\});\s*$/.exec(source);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as GrammarRegistry;
  } catch {
    return null;
  }
}

export type CompatReport = {
  sameVersion: boolean;
  clientVersion: string;
  serverVersion: string;
  /** A sinf (to'sqinlik): server ustozlarga ruxsat bergan/darsga bog'langan qoida, lekin client uni ko'rsata olmaydi → o'quvchida 404. */
  blocking: string[];
  /** B sinf (ogohlantirish): client'da tayyor, serverda hali yo'q → ustoz hali tanlay olmaydi (zararsiz). */
  warnings: string[];
};

const isApproved = (r: { status: string } | undefined) => r?.status === "approved";

/**
 * Yo'naltirilgan moslik: server `approved` deb hisoblagan har bir qoida client'da ham `approved` bo'lishi shart.
 * Aks holda o'quvchi darsdagi havolani bossa client 404 beradi. Tenglik (versiya bir xilligi) deploy tugagach tekshiriladi.
 */
export function compareRegistries(client: GrammarRegistry, server: GrammarRegistry): CompatReport {
  const c = new Map(client.rules.map((r) => [r.id, r]));
  const s = new Map(server.rules.map((r) => [r.id, r]));
  const clientLang = new Map(client.languages.map((l) => [l.code, l.enabled]));
  const blocking: string[] = [];
  const warnings: string[] = [];

  for (const [id, sr] of s) {
    if (!isApproved(sr)) continue;
    const cr = c.get(id);
    if (!cr) blocking.push(`${id}: serverda approved, client'da yo'q (o'quvchi 404 ko'radi)`);
    else if (!isApproved(cr)) blocking.push(`${id}: serverda approved, client'da '${cr.status}' (o'quvchi 404 ko'radi)`);
    else if (clientLang.get(cr.lang) !== true) blocking.push(`${id}: client'da '${cr.lang}' tili yoqilmagan (o'quvchi 404 ko'radi)`);
    else if (cr.slug !== sr.slug) warnings.push(`${id}: slug farqi (server '${sr.slug}', client '${cr.slug}'): ID orqali ishlaydi`);
  }
  for (const [id, cr] of c) {
    if (isApproved(cr) && !isApproved(s.get(id))) warnings.push(`${id}: client'da approved, serverda hali yo'q (ustoz tanlay olmaydi)`);
  }
  const serverRetired = new Set(server.retired.map((t) => t.id));
  for (const t of client.retired) {
    if (!serverRetired.has(t.id) && s.has(t.id)) warnings.push(`${t.id}: client'da nafaqaga chiqarilgan, serverda hali jonli`);
  }
  return {
    sameVersion: client.version === server.version,
    clientVersion: client.version,
    serverVersion: server.version,
    blocking,
    warnings,
  };
}
