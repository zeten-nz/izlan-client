// Grammatika kontenti sxemalari (zod). Sof modul: fs yoki Next'ga bog'liq emas.
import { z } from "zod";
import { LANG_RE, RULE_ID_RE, SLUG_RE } from "./ids.ts";
import { stripStress } from "./text.ts";

export const SCHEMA_VERSION = 1;
export const STATUSES = ["draft", "review", "approved"] as const;
export type Status = (typeof STATUSES)[number];
export const BLOCK_KINDS = ["table", "conjugation", "declension"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];
export const LEVEL_SYSTEMS = ["cefr", "jlpt", "none"] as const;
export type LevelSystem = (typeof LEVEL_SYSTEMS)[number];

export const LEVEL_VALUES = {
  cefr: ["A1", "A2", "B1", "B2", "C1", "C2"],
  jlpt: ["N5", "N4", "N3", "N2", "N1"],
} as const;

/** Yozuv tizimlari (ISO 15924). Til reyestrida har til uchun e'lon qilinadi; misol matni shunga tekshiriladi. */
export const SCRIPTS = ["Latn", "Cyrl", "Jpan"] as const;
export type Script = (typeof SCRIPTS)[number];

/** Furigana o'qilishi: faqat hiragana/katakana (va cho'zish belgisi `ー`). */
const KANA_READING = /^[ぁ-ゖァ-ヺー]+$/;

const text = (max: number) => z.string().trim().min(1).max(max);
const langCode = z.string().regex(LANG_RE, "til kodi 2-3 ta kichik lotin harf bo'lishi kerak");
const ruleId = z.string().regex(RULE_ID_RE, "ID formati: gr_<til>_<6 raqam>");
const slug = z.string().max(60).regex(SLUG_RE, "slug kichik lotin harf, raqam va '-' dan iborat bo'lishi kerak");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sana YYYY-MM-DD bo'lishi kerak");

// ───────── tillar reyestri (languages.json)

const categorySchema = z.strictObject({
  id: slug,
  title: z.record(langCode, text(80)).refine((t) => "uz" in t, "title.uz majburiy"),
});

const languageSchema = z
  .strictObject({
    name: text(40),
    nativeName: text(40),
    enabled: z.boolean(),
    dir: z.enum(["ltr", "rtl"]),
    levelSystem: z.enum(LEVEL_SYSTEMS),
    /** Til yozuvi: misol matni shu yozuvlardan kamida bittasini o'z ichiga olishi shart (noto'g'ri til xatosini ushlaydi). */
    scripts: z.array(z.enum(SCRIPTS)).min(1),
    blocks: z.array(z.enum(BLOCK_KINDS)).min(1),
    categories: z.array(categorySchema).min(1),
  })
  .superRefine((l, ctx) => {
    const seen = new Set<string>();
    l.categories.forEach((c, i) => {
      if (seen.has(c.id)) ctx.addIssue({ code: "custom", path: ["categories", i, "id"], message: `kategoriya ID takrorlangan: ${c.id}` });
      seen.add(c.id);
    });
  });

export const languagesFileSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  // Tushuntirish tillari o'rganilayotgan tillardan mustaqil.
  explanationLanguages: z.array(langCode).min(1),
  languages: z.record(langCode, languageSchema),
});
export type LanguagesFile = z.infer<typeof languagesFileSchema>;

// ───────── redirects / retired (redirects.json)

export const redirectsFileSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  // Eski slug → doimiy ID. Faqat shu tilning jonli qoidasiga ishora qiladi.
  redirects: z.array(z.strictObject({ lang: langCode, from: slug, id: ruleId })),
  // Nafaqaga chiqarilgan ID'lar (qayta ishlatilmaydi, eski havolalar uchun qoladi).
  retired: z.array(
    z.strictObject({ id: ruleId, reason: text(200), retiredAt: isoDate, replacedBy: ruleId.optional() }),
  ),
});
export type RedirectsFile = z.infer<typeof redirectsFileSchema>;

// ───────── qoida metadata (rule.json): til va tushuntirishdan mustaqil identifikatsiya

const levelSchema = z
  .strictObject({
    system: z.enum(["cefr", "jlpt"]),
    value: z.string(),
    /** true bo'lsa daraja metodist tomonidan tasdiqlangan; yo'q/false bo'lsa "taxminiy" deb ko'rsatiladi. */
    confirmed: z.boolean().optional(),
  })
  .superRefine((l, ctx) => {
    if (!(LEVEL_VALUES[l.system] as readonly string[]).includes(l.value)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: `${l.system} uchun noto'g'ri daraja: ${l.value}` });
    }
  });

export const ruleMetaSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: ruleId,
    lang: langCode,
    slug,
    category: slug,
    level: levelSchema.optional(),
    related: z.array(ruleId).max(20),
  })
  .superRefine((r, ctx) => {
    const idLang = RULE_ID_RE.exec(r.id)?.[1];
    if (idLang && idLang !== r.lang) {
      ctx.addIssue({ code: "custom", path: ["id"], message: `ID tili (${idLang}) lang (${r.lang}) bilan mos emas` });
    }
    if (r.related.includes(r.id)) ctx.addIssue({ code: "custom", path: ["related"], message: "qoida o'ziga bog'lanmaydi" });
  });
export type RuleMeta = z.infer<typeof ruleMetaSchema>;

// ───────── tarjima/tushuntirish fayli frontmatter'i (<explanationLang>.mdx)

/**
 * Furigana segmenti: `base` asosiy matn bo'lagi, `reading` ixtiyoriy kana o'qilishi.
 * Segmentlar ketma-ket birlashtirilganda asl matnga teng bo'lishi shart (tekshiriladi).
 * Render: <ruby>base<rt>reading</rt></ruby> — React elementlari sifatida, xom HTML emas.
 */
export const rubySegmentSchema = z.strictObject({
  base: text(40),
  reading: z.string().max(40).regex(KANA_READING, "reading faqat hiragana/katakana bo'lishi kerak").optional(),
});
export const rubyTextSchema = z.array(rubySegmentSchema).min(1).max(80);
export type RubySegment = z.infer<typeof rubySegmentSchema>;

export const exampleSchema = z
  .strictObject({
    text: text(300), // o'rganilayotgan tilda
    translation: text(300), // tushuntirish tilida
    note: text(300).optional(),
    reading: text(300).optional(), // ja: butun gap o'qilishi (kana), segmentsiz oddiy variant
    stressed: text(300).optional(), // ru: urg'u belgilangan shakl (U+0301); urg'usiz holda `text` ga teng
    ruby: rubyTextSchema.optional(), // ja: furigana segmentlari
    romanization: text(300).optional(), // rōmaji/translit (ixtiyoriy)
  })
  .superRefine((e, ctx) => {
    if (e.stressed !== undefined && stripStress(e.stressed) !== e.text.normalize("NFC")) {
      ctx.addIssue({ code: "custom", path: ["stressed"], message: "stressed urg'u belgilarisiz text bilan bir xil bo'lishi kerak" });
    }
    if (e.ruby !== undefined && e.ruby.map((s) => s.base).join("") !== e.text) {
      ctx.addIssue({ code: "custom", path: ["ruby"], message: "ruby segmentlari (base) birlashtirilganda text ga teng bo'lishi kerak" });
    }
  });

export const sourceSchema = z.strictObject({
  title: text(160),
  url: z.string().max(300).regex(/^https:\/\/\S+$/, "url https:// bilan boshlanishi kerak").optional(),
  license: text(80).optional(),
  note: text(300).optional(),
});
export type Source = z.infer<typeof sourceSchema>;

const tableBlock = z
  .strictObject({
    kind: z.literal("table"),
    caption: text(120).optional(),
    headers: z.array(text(80)).min(1).max(8),
    rows: z.array(z.array(text(200)).min(1).max(8)).min(1).max(60),
  })
  .superRefine((b, ctx) => {
    b.rows.forEach((row, i) => {
      if (row.length !== b.headers.length) {
        ctx.addIssue({ code: "custom", path: ["rows", i], message: `qator ustunlari soni sarlavhadagidek bo'lishi kerak (${b.headers.length})` });
      }
    });
  });

const conjugationBlock = z.strictObject({
  kind: z.literal("conjugation"),
  caption: text(120).optional(),
  forms: z
    .array(
      z.strictObject({
        label: text(80),
        value: text(120), // ru: urg'u belgisi (U+0301) bilan bo'lishi mumkin
        reading: text(120).optional(),
        ruby: rubyTextSchema.optional(), // ja: furigana
      }),
    )
    .min(1)
    .max(40),
});

/** Rus tilidagi 6 ta asosiy kelishik (barqaror identifikator; `case` — ko'rsatiladigan nom). */
export const CASE_IDS = ["nom", "gen", "dat", "acc", "ins", "prep"] as const;
export type CaseId = (typeof CASE_IDS)[number];
export const GENDERS = ["m", "f", "n"] as const;

const declensionBlock = z
  .strictObject({
    kind: z.literal("declension"),
    caption: text(120).optional(),
    word: text(60).optional(), // paradigma so'zi (masalan: книга)
    gender: z.enum(GENDERS).optional(), // m: мужской, f: женский, n: средний
    rows: z
      .array(
        z.strictObject({
          case: text(60),
          caseId: z.enum(CASE_IDS).optional(),
          singular: text(120), // urg'u belgisi (U+0301) bilan bo'lishi mumkin
          plural: text(120),
          note: text(200).optional(),
        }),
      )
      .min(1)
      .max(12),
  })
  .superRefine((b, ctx) => {
    const seen = new Set<string>();
    b.rows.forEach((r, i) => {
      if (!r.caseId) return;
      if (seen.has(r.caseId)) ctx.addIssue({ code: "custom", path: ["rows", i, "caseId"], message: `kelishik takrorlangan: ${r.caseId}` });
      seen.add(r.caseId);
    });
  });

const blockSchema = z.discriminatedUnion("kind", [tableBlock, conjugationBlock, declensionBlock]);
export type Block = z.infer<typeof blockSchema>;

/**
 * Tekshiruv yozuvi. `approved` uchun HAMMA maydon majburiy va metodist (reviewers.json'dagi reviewer) shaxsan to'ldiradi:
 *  - reviewedBy: reviewer ID (reviewers.json), reviewedAt: sana,
 *  - reviewedRevision: tekshirilgan tahrir raqami (kontent o'zgarsa revision oshadi → qayta tekshiruv),
 *  - contentHash: tekshirilgan kontent xeshi (`npm run grammar:hash`); kontent o'zgarsa xesh mos kelmaydi,
 *  - checks: reviewer tasdiqlagan bandlar (hammasi true bo'lishi shart).
 * Muhim: bu yozuv "kimdir tekshirdi" degan metadata. Grammatik to'g'rilikni dastur tasdiqlamaydi.
 */
export const REVIEW_CHECKS = ["grammar", "examples", "translations", "level"] as const;
const checksSchema = z.strictObject({
  /** Qoida tavsifi va formulalar grammatik jihatdan to'g'ri */
  grammar: z.boolean(),
  /** Misollar, istisnolar va xatolar to'g'ri va tabiiy */
  examples: z.boolean(),
  /** Tarjimalar/tushuntirishlar to'g'ri */
  translations: z.boolean(),
  /** Daraja (CEFR/JLPT) tekshirilgan (yoki daraja ko'rsatilmagan) */
  level: z.boolean(),
});
const contentHash = z.string().regex(/^[0-9a-f]{16}$/, "contentHash 16 ta hex belgi bo'lishi kerak");
const reviewApproved = z.strictObject({
  reviewedBy: text(80),
  reviewedAt: isoDate,
  reviewedRevision: z.number().int().min(1),
  contentHash,
  checks: checksSchema,
  notes: text(300).optional(),
});
/** draft/review holatida tekshiruv jarayoni davom etishi mumkin: hamma maydon ixtiyoriy. */
const reviewPartial = z.strictObject({
  reviewedBy: text(80).optional(),
  reviewedAt: isoDate.optional(),
  reviewedRevision: z.number().int().min(1).optional(),
  contentHash: contentHash.optional(),
  checks: checksSchema.partial().optional(),
  notes: text(300).optional(),
});

const baseTranslation = {
  ruleId,
  explanationLang: langCode,
  title: text(120),
  summary: text(400),
  revision: z.number().int().min(1),
  formulas: z.array(z.strictObject({ label: text(80), pattern: text(200), note: text(300).optional() })).max(12),
  examples: z.array(exampleSchema).max(40),
  exceptions: z.array(z.strictObject({ title: text(120), body: text(600) })).max(20),
  commonMistakes: z
    .array(z.strictObject({ wrong: text(200), right: text(200), explanation: text(400) }))
    .max(20),
  blocks: z.array(blockSchema).max(12),
  /** Qidiruv uchun qo'shimcha kalit so'zlar (turli yozuvlarda: lotin, kirill, kana, kanji). */
  keywords: z.array(text(60)).max(20).optional(),
  /** Manbalar. approved uchun kamida bittasi va litsenziya ma'lumoti majburiy. */
  sources: z.array(sourceSchema).max(10).optional(),
  /** Kontent muallifi (ID yoki ism). approved uchun majburiy va reviewer'dan farqli bo'lishi kerak. */
  author: text(80).optional(),
};

const draftTranslation = z.strictObject({
  ...baseTranslation,
  status: z.literal("draft"),
  review: reviewPartial.optional(),
});
const reviewTranslation = z.strictObject({
  ...baseTranslation,
  status: z.literal("review"),
  review: reviewPartial.optional(),
});
// Faqat approved ommaga chiqishi mumkin: metodist ma'lumoti va minimal kontent sifati majburiy.
const approvedTranslation = z
  .strictObject({ ...baseTranslation, status: z.literal("approved"), review: reviewApproved })
  .superRefine((t, ctx) => {
    const bad = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    if (t.examples.length < 2) bad(["examples"], "approved qoidada kamida 2 ta misol bo'lishi kerak");
    if (!t.author) bad(["author"], "approved qoidada muallif (author) ko'rsatilishi shart");
    if (!t.sources || t.sources.length < 1) bad(["sources"], "approved qoidada kamida bitta manba ko'rsatilishi shart");
    t.sources?.forEach((src, i) => {
      if (!src.license) bad(["sources", i, "license"], "har bir manbada litsenziya (yoki 'original' yozuvi) ko'rsatilishi shart");
    });
    for (const k of REVIEW_CHECKS) {
      if (t.review.checks[k] !== true) bad(["review", "checks", k], `reviewer '${k}' bandini tasdiqlamagan`);
    }
    if (t.review.reviewedRevision !== t.revision) {
      bad(["review", "reviewedRevision"], `tekshirilgan tahrir (${t.review.reviewedRevision}) joriy tahrir (${t.revision}) bilan mos emas: qayta tekshiruv kerak`);
    }
    if (t.author && t.author === t.review.reviewedBy) bad(["review", "reviewedBy"], "muallif o'z kontentini o'zi tasdiqlay olmaydi");
  });

/** Tekshiruvchilar reyestri (content/grammar/reviewers.json): approved faqat shu ro'yxatdagi shaxs tomonidan. */
export const reviewersFileSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    reviewers: z.array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,38}$/, "reviewer ID: kichik lotin harf, raqam, '.', '_' yoki '-'"),
        name: text(80),
        role: z.enum(["methodist", "language-expert"]),
        /** Qaysi o'rganilayotgan tillar uchun tasdiqlash huquqi bor (til kodlari) */
        languages: z.array(langCode).min(1),
        addedAt: isoDate,
        /** Reviewer'ni kim tayinlagan (PR/qaror havolasi yoki ism) */
        appointedBy: text(120),
      }),
    ),
  })
  .superRefine((f, ctx) => {
    const seen = new Set<string>();
    f.reviewers.forEach((r, i) => {
      if (seen.has(r.id)) ctx.addIssue({ code: "custom", path: ["reviewers", i, "id"], message: `reviewer ID takrorlangan: ${r.id}` });
      seen.add(r.id);
    });
  });
export type ReviewersFile = z.infer<typeof reviewersFileSchema>;

export const translationSchema = z.discriminatedUnion("status", [
  draftTranslation,
  reviewTranslation,
  approvedTranslation,
]);
export type TranslationFrontmatter = z.infer<typeof translationSchema>;

// ───────── build manifest

export const manifestSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  rules: z.array(
    z.strictObject({
      id: ruleId,
      lang: langCode,
      slug,
      category: slug,
      level: z.strictObject({ system: z.enum(["cefr", "jlpt"]), value: z.string(), confirmed: z.boolean().optional() }).optional(),
      translations: z.array(
        z.strictObject({
          lang: langCode,
          status: z.enum(STATUSES),
          revision: z.number().int().min(1),
          /** Kontent xeshi: reviewer tasdiqlagandan keyin o'zgarishni aniqlash va revision majburlash uchun */
          contentHash,
          reviewedBy: z.string().optional(),
        }),
      ),
    }),
  ),
  redirects: redirectsFileSchema.shape.redirects,
  retired: redirectsFileSchema.shape.retired,
});
export type Manifest = z.infer<typeof manifestSchema>;

/** Repo'da saqlangan oldingi manifest: eski formatlar (contentHash'siz) bilan moslik uchun yumshoq. */
export const committedManifestSchema = z.looseObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  rules: z.array(
    z.looseObject({
      id: ruleId,
      translations: z.array(
        z.looseObject({ lang: langCode, status: z.enum(STATUSES), revision: z.number().int().min(1), contentHash: z.string().optional() }),
      ),
    }),
  ),
});
export type CommittedManifest = z.infer<typeof committedManifestSchema>;
