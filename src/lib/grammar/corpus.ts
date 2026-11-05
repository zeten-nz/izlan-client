// Xom fayllar → tekshirilgan korpus. Sof modul (fs yo'q): testlarda xotiradagi fixture'lar bilan ishlaydi.
import { parseFrontmatter } from "./frontmatter.ts";
import { lintMdxBody } from "./mdx-lint.ts";
import { reviewContentHash } from "./review.ts";
import { hasAnyScript, type KnownScript } from "./text.ts";
import {
  committedManifestSchema,
  languagesFileSchema,
  redirectsFileSchema,
  reviewersFileSchema,
  ruleMetaSchema,
  translationSchema,
  type CommittedManifest,
  type LanguagesFile,
  type RedirectsFile,
  type ReviewersFile,
  type RuleMeta,
  type TranslationFrontmatter,
} from "./schema.ts";
import type { ZodError } from "zod";

export type RawFile = { path: string; text: string };
export type RawCorpus = {
  languages: RawFile;
  redirects: RawFile;
  rules: { meta: RawFile; translations: RawFile[] }[];
  /** Repo'da saqlangan oldingi manifest (ID'lar o'chirilmaganini tekshirish uchun). */
  committedManifest?: RawFile;
  /** Tekshiruvchilar reyestri (reviewers.json). Yo'q bo'lsa — bo'sh: hech kim tasdiqlay olmaydi. */
  reviewers?: RawFile;
};

export type Problem = { file: string; message: string };
export type Translation = {
  lang: string;
  file: string;
  data: TranslationFrontmatter;
  body: string;
  /** Kontent xeshi (frontmatter status/review'siz + tana): reviewer tasdiqlagan qiymat bilan solishtiriladi. */
  contentHash: string;
};
export type Rule = { meta: RuleMeta; file: string; translations: Translation[] };
export type Corpus = { languages: LanguagesFile | null; redirects: RedirectsFile | null; reviewers: ReviewersFile | null; rules: Rule[] };

const fmt = (e: ZodError) => e.issues.map((i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`);

function parseJson(file: RawFile, problems: Problem[]): unknown {
  try {
    return JSON.parse(file.text);
  } catch (e) {
    problems.push({ file: file.path, message: `yaroqli JSON emas: ${(e as Error).message}` });
    return undefined;
  }
}

export function parseCorpus(raw: RawCorpus): { corpus: Corpus; problems: Problem[]; committed: CommittedManifest | null } {
  const problems: Problem[] = [];
  const add = (file: string, message: string) => problems.push({ file, message });

  // 1) reyestrlar
  let languages: LanguagesFile | null = null;
  const langJson = parseJson(raw.languages, problems);
  if (langJson !== undefined) {
    const r = languagesFileSchema.safeParse(langJson);
    if (r.success) languages = r.data;
    else fmt(r.error).forEach((m) => add(raw.languages.path, m));
  }
  let redirects: RedirectsFile | null = null;
  const redJson = parseJson(raw.redirects, problems);
  if (redJson !== undefined) {
    const r = redirectsFileSchema.safeParse(redJson);
    if (r.success) redirects = r.data;
    else fmt(r.error).forEach((m) => add(raw.redirects.path, m));
  }
  let reviewers: ReviewersFile | null = { schemaVersion: 1, reviewers: [] };
  if (raw.reviewers) {
    reviewers = null;
    const rj = parseJson(raw.reviewers, problems);
    if (rj !== undefined) {
      const r = reviewersFileSchema.safeParse(rj);
      if (r.success) reviewers = r.data;
      else fmt(r.error).forEach((m) => add(raw.reviewers!.path, m));
    }
  }
  let committed: CommittedManifest | null = null;
  if (raw.committedManifest) {
    const j = parseJson(raw.committedManifest, problems);
    if (j !== undefined) {
      const r = committedManifestSchema.safeParse(j);
      if (r.success) committed = r.data;
      else fmt(r.error).forEach((m) => add(raw.committedManifest!.path, m));
    }
  }

  // 2) qoidalar
  const rules: Rule[] = [];
  for (const rr of raw.rules) {
    const metaJson = parseJson(rr.meta, problems);
    if (metaJson === undefined) continue;
    const mr = ruleMetaSchema.safeParse(metaJson);
    if (!mr.success) {
      fmt(mr.error).forEach((m) => add(rr.meta.path, m));
      continue;
    }
    const rule: Rule = { meta: mr.data, file: rr.meta.path, translations: [] };
    for (const tf of rr.translations) {
      const fm = parseFrontmatter(tf.text);
      if (!fm.ok) {
        add(tf.path, fm.error);
        continue;
      }
      const tr = translationSchema.safeParse(fm.data);
      if (!tr.success) {
        fmt(tr.error).forEach((m) => add(tf.path, m));
        continue;
      }
      lintMdxBody(fm.body, fm.bodyStartLine).forEach((m) => add(tf.path, m));
      const fileLang = /([^\\/]+)\.mdx$/.exec(tf.path)?.[1];
      if (fileLang !== tr.data.explanationLang) {
        add(tf.path, `fayl nomi (${fileLang}) explanationLang (${tr.data.explanationLang}) bilan mos emas`);
      }
      rule.translations.push({
        lang: tr.data.explanationLang,
        file: tf.path,
        data: tr.data,
        body: fm.body,
        contentHash: reviewContentHash(fm.data as Record<string, unknown>, fm.body),
      });
    }
    rules.push(rule);
  }

  const corpus: Corpus = { languages, redirects, reviewers, rules };
  crossCheck(corpus, committed, add);
  return { corpus, problems, committed };
}

/** Misol matnlari til yozuviga mosligi; urg'u (Kirill) va furigana (yapon) faqat o'z tillarida. */
function checkScripts(
  t: Translation,
  lang: string,
  scripts: readonly KnownScript[],
  add: (file: string, msg: string) => void,
): void {
  const allowsRuby = scripts.includes("Jpan");
  const allowsStress = scripts.includes("Cyrl");
  t.data.examples.forEach((e, i) => {
    if (!hasAnyScript(e.text, scripts)) {
      add(t.file, `examples.${i}.text: ${lang} tili yozuvi (${scripts.join("/")}) topilmadi: "${e.text}"`);
    }
    if (e.ruby && !allowsRuby) add(t.file, `examples.${i}.ruby: ${lang} tilida furigana ruxsat etilmagan`);
    if (e.stressed && !allowsStress) add(t.file, `examples.${i}.stressed: ${lang} tilida urg'u belgisi ruxsat etilmagan`);
  });
  t.data.blocks.forEach((b, i) => {
    if (b.kind === "conjugation" && !allowsRuby && b.forms.some((f) => f.ruby)) {
      add(t.file, `blocks.${i}: ${lang} tilida furigana ruxsat etilmagan`);
    }
  });
}

function crossCheck(c: Corpus, committed: CommittedManifest | null, add: (file: string, msg: string) => void): void {
  const byId = new Map<string, Rule>();
  const bySlug = new Map<string, Rule>();
  for (const r of c.rules) {
    const { id, lang, slug } = r.meta;
    if (byId.has(id)) add(r.file, `ID takrorlangan: ${id} (${byId.get(id)!.file})`);
    else byId.set(id, r);
    const key = `${lang}/${slug}`;
    if (bySlug.has(key)) add(r.file, `slug takrorlangan: ${key} (${bySlug.get(key)!.file})`);
    else bySlug.set(key, r);
    if (r.translations.length === 0) add(r.file, "kamida bitta tushuntirish fayli (<til>.mdx) kerak");
  }
  const retiredIds = new Set(c.redirects?.retired.map((x) => x.id) ?? []);

  for (const r of c.rules) {
    const { meta } = r;
    const lang = c.languages?.languages[meta.lang];
    if (c.languages) {
      if (!lang) add(r.file, `noma'lum til: ${meta.lang} (languages.json'da yo'q)`);
      else {
        if (!lang.categories.some((x) => x.id === meta.category)) {
          add(r.file, `noma'lum kategoriya: ${meta.category} (${meta.lang} uchun)`);
        }
        if (lang.levelSystem === "none" && meta.level) add(r.file, `${meta.lang} tilida daraja tizimi yo'q`);
        else if (meta.level && lang.levelSystem !== meta.level.system) {
          add(r.file, `daraja tizimi mos emas: ${meta.level.system} (til uchun kutilgan: ${lang.levelSystem})`);
        }
      }
    }
    if (retiredIds.has(meta.id)) add(r.file, `ID nafaqaga chiqarilgan, qayta ishlatib bo'lmaydi: ${meta.id}`);
    for (const rel of meta.related) {
      if (!byId.has(rel)) add(r.file, `bog'liq qoida topilmadi: ${rel}`);
    }
    const seenLang = new Set<string>();
    for (const t of r.translations) {
      if (t.data.ruleId !== meta.id) add(t.file, `ruleId (${t.data.ruleId}) rule.json ID (${meta.id}) bilan mos emas`);
      if (c.languages && !c.languages.explanationLanguages.includes(t.lang)) {
        add(t.file, `tushuntirish tili ruxsat etilmagan: ${t.lang}`);
      }
      if (seenLang.has(t.lang)) add(t.file, `tushuntirish tili takrorlangan: ${t.lang}`);
      seenLang.add(t.lang);
      t.data.blocks.forEach((b, i) => {
        if (lang && !lang.blocks.includes(b.kind)) add(t.file, `blocks.${i}: '${b.kind}' bloki ${meta.lang} tilida ruxsat etilmagan`);
      });
      if (lang) checkScripts(t, meta.lang, lang.scripts as readonly KnownScript[], add);
    }
  }

  // ───── tasdiqlash siyosati (governance)
  const reviewers = new Map((c.reviewers?.reviewers ?? []).map((r) => [r.id, r]));
  const prevByKey = new Map<string, { revision: number; contentHash?: string }>();
  for (const old of committed?.rules ?? []) for (const t of old.translations) prevByKey.set(`${old.id}/${t.lang}`, t);

  for (const r of c.rules) {
    let hasApproved = false;
    for (const t of r.translations) {
      const prev = prevByKey.get(`${r.meta.id}/${t.lang}`);
      // Kontent o'zgargan bo'lsa revision oshirilishi shart (tarix va qayta tekshiruv uchun)
      if (prev?.contentHash && prev.contentHash !== t.contentHash && t.data.revision <= prev.revision) {
        add(t.file, `kontent o'zgargan, lekin revision oshirilmagan (${prev.revision} → ${t.data.revision}). revision'ni oshiring va statusni 'review' ga qaytaring`);
      }
      if (t.data.status !== "approved") continue;
      hasApproved = true;
      const rv = reviewers.get(t.data.review.reviewedBy);
      if (!rv) {
        add(t.file, `reviewer '${t.data.review.reviewedBy}' reviewers.json'da yo'q: tasdiqlash huquqi berilmagan (metodist tayinlanishi kerak)`);
      } else if (!rv.languages.includes(r.meta.lang)) {
        add(t.file, `reviewer '${rv.id}' '${r.meta.lang}' tili uchun tayinlanmagan`);
      }
      if (t.data.review.contentHash !== t.contentHash) {
        add(
          t.file,
          `kontent tasdiqlangandan keyin o'zgargan (contentHash mos emas): qayta tekshiruv kerak. Joriy xesh: ${t.contentHash} (\`npm run grammar:hash\`)`,
        );
      }
    }
    if (r.meta.level?.confirmed === true && !hasApproved) {
      add(r.file, "daraja 'confirmed: true' faqat kamida bitta approved tarjimasi bor qoidada bo'lishi mumkin");
    }
  }

  const seenRedirect = new Set<string>();
  for (const rd of c.redirects?.redirects ?? []) {
    const file = "redirects.json";
    const key = `${rd.lang}/${rd.from}`;
    if (seenRedirect.has(key)) add(file, `redirect takrorlangan: ${key}`);
    seenRedirect.add(key);
    if (bySlug.has(key)) add(file, `redirect manbasi jonli slug bilan to'qnashadi: ${key}`);
    const target = byId.get(rd.id);
    if (!target) add(file, `redirect maqsadi topilmadi: ${rd.id}`);
    else if (target.meta.lang !== rd.lang) add(file, `redirect tili (${rd.lang}) maqsad tili (${target.meta.lang}) bilan mos emas`);
  }
  for (const rt of c.redirects?.retired ?? []) {
    if (rt.replacedBy && !byId.has(rt.replacedBy)) add("redirects.json", `replacedBy topilmadi: ${rt.replacedBy}`);
  }

  // ID hech qachon yo'qolmaydi: manifestdagi har bir ID jonli yoki retired bo'lishi shart.
  for (const old of committed?.rules ?? []) {
    if (!byId.has(old.id) && !retiredIds.has(old.id)) {
      add("manifest.json", `ID yo'qolgan: ${old.id}. O'chirmang: redirects.json 'retired' ro'yxatiga qo'shing`);
    }
  }
}
