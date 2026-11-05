import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseCorpus, type RawCorpus } from "../corpus.ts";
import { readRawCorpus } from "../fs-source.ts";
import { parseFrontmatter } from "../frontmatter.ts";
import { formatRuleId, nextRuleId, parseRuleId } from "../ids.ts";
import { buildManifest, publicTranslations, resolveSlug, serializeManifest } from "../manifest.ts";
import { lintMdxBody } from "../mdx-lint.ts";
import { approved, REVIEWERS_RAW } from "./helpers.ts";

// ───────── fixture yordamchilari

const LANGUAGES = {
  schemaVersion: 1,
  explanationLanguages: ["uz"],
  languages: {
    en: {
      name: "English", nativeName: "English", enabled: true, dir: "ltr", levelSystem: "cefr", scripts: ["Latn"],
      blocks: ["table", "conjugation"],
      categories: [{ id: "tenses", title: { uz: "Zamonlar" } }],
    },
    ja: {
      name: "Japanese", nativeName: "日本語", enabled: false, dir: "ltr", levelSystem: "jlpt", scripts: ["Jpan"],
      blocks: ["table"],
      categories: [{ id: "particles", title: { uz: "Partikllar" } }],
    },
  },
};

const trData = (over: Record<string, unknown> = {}) => ({
  ruleId: "gr_en_000001", explanationLang: "uz", status: "approved", revision: 1,
  title: "Present Perfect", summary: "Qisqa tavsif.",
  formulas: [], exceptions: [], commonMistakes: [], blocks: [],
  examples: [
    { text: "I have finished.", translation: "Men tugatdim." },
    { text: "She has left.", translation: "U ketdi." },
  ],
  review: { reviewedBy: "Metodist", reviewedAt: "2026-10-15" },
  ...over,
});

// approved + review bor bo'lsa, governance talablariga mos (hash, muallif, manba) qilib to'ldiriladi
const mdx = (data: unknown, body = "Matn.\n") => {
  const d = data as Record<string, unknown>;
  const final = d.status === "approved" && d.review !== undefined ? approved(d, body) : d;
  return `---\n${JSON.stringify(final, null, 2)}\n---\n\n${body}`;
};
const meta = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1, id: "gr_en_000001", lang: "en", slug: "present-perfect", category: "tenses", related: [], ...over,
});
const ruleFiles = (m: unknown, t: unknown, body?: string, dir = "present-perfect", file = "uz.mdx") => ({
  meta: { path: `en/${dir}/rule.json`, text: JSON.stringify(m) },
  translations: [{ path: `en/${dir}/${file}`, text: mdx(t, body) }],
});

function corpus(over: Partial<RawCorpus> & { rules?: RawCorpus["rules"] } = {}): RawCorpus {
  return {
    languages: { path: "languages.json", text: JSON.stringify(LANGUAGES) },
    redirects: { path: "redirects.json", text: JSON.stringify({ schemaVersion: 1, redirects: [], retired: [] }) },
    rules: [ruleFiles(meta(), trData())],
    reviewers: REVIEWERS_RAW,
    ...over,
  };
}
const problemsOf = (raw: RawCorpus) => parseCorpus(raw).problems.map((p) => p.message);
const has = (list: string[], part: string) => assert.ok(list.some((m) => m.includes(part)), `'${part}' topilmadi:\n${list.join("\n")}`);

// ───────── ID

describe("ids", () => {
  it("formatlaydi va parse qiladi", () => {
    assert.equal(formatRuleId("en", 7), "gr_en_000007");
    assert.deepEqual(parseRuleId("gr_ja_000123"), { lang: "ja", seq: 123 });
    assert.equal(parseRuleId("present-perfect"), null);
  });
  it("nextRuleId til bo'yicha va nafaqadagilarni hisobga oladi", () => {
    assert.equal(nextRuleId("en", ["gr_en_000002", "gr_ja_000009", "gr_en_000001"]), "gr_en_000003");
    assert.equal(nextRuleId("ru", []), "gr_ru_000001");
  });
});

// ───────── frontmatter va MDX lint

describe("frontmatter", () => {
  it("JSON frontmatter va tanani ajratadi", () => {
    const r = parseFrontmatter('---\n{"a": 1}\n---\nSalom\n');
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.body, "Salom\n");
  });
  it("noto'g'ri formatni rad etadi", () => {
    assert.equal(parseFrontmatter("Salom").ok, false);
    assert.equal(parseFrontmatter("---\n{bad}\n---\n").ok, false);
    assert.equal(parseFrontmatter("---\n[1]\n---\n").ok, false);
  });
});

describe("mdx lint", () => {
  it("oddiy markdown va Callout o'tadi", () => {
    assert.deepEqual(lintMdxBody('## Sarlavha\n\n- **a**\n\n<Callout tone="tip">\nMatn\n</Callout>\n'), []);
  });
  it("xavfli konstruksiyalarni rad etadi", () => {
    for (const bad of [
      "import X from 'x'",
      "{process.env.SECRET}",
      "<script>alert(1)</script>",
      "<div onclick=\"x\">",
      "[x](javascript:alert(1))",
      "![rasm](/a.png)",
      "<!-- izoh -->",
      '<Callout onClick="x">a</Callout>',
      "<Unknown />",
    ]) {
      assert.ok(lintMdxBody(bad).length > 0, `rad etilmadi: ${bad}`);
    }
  });
  it("kod bloki va avtolink ichi tekshirilmaydi", () => {
    assert.deepEqual(lintMdxBody("```\nimport x\n{a}\n```\n\nSee <https://example.com> va `{x}`."), []);
  });
  it("yopilmagan kod blokini topadi", () => {
    assert.ok(lintMdxBody("```\nx").length > 0);
  });
});

// ───────── korpus validatsiyasi

describe("corpus", () => {
  it("to'g'ri korpus muammosiz", () => {
    assert.deepEqual(problemsOf(corpus()), []);
  });

  it("approved metodist ma'lumotisiz va <2 misol bilan rad etiladi", () => {
    const noReview = trData({ review: undefined });
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), noReview)] })), "review");
    const oneExample = trData({ examples: [{ text: "A.", translation: "B." }] });
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), oneExample)] })), "kamida 2 ta misol");
  });

  it("draft/review hech qachon ommaga chiqmaydi, approved chiqadi", () => {
    for (const status of ["draft", "review"]) {
      const { corpus: c, problems } = parseCorpus(corpus({ rules: [ruleFiles(meta(), trData({ status, review: undefined }))] }));
      assert.deepEqual(problems, []);
      assert.equal(publicTranslations(c).length, 0);
    }
    const { corpus: c } = parseCorpus(corpus());
    assert.equal(publicTranslations(c).length, 1);
  });

  it("yoqilmagan til qoidalari (hatto approved) ommaga chiqmaydi, lekin validatsiyadan o'tadi", () => {
    const ja = ruleFiles(
      meta({ id: "gr_ja_000001", lang: "ja", slug: "wa-ga", category: "particles", level: { system: "jlpt", value: "N5" } }),
      trData({
        ruleId: "gr_ja_000001",
        examples: [
          { text: "私は学生です。", translation: "Men talabaman." },
          { text: "これは本です。", translation: "Bu kitob." },
        ],
      }),
      undefined, "wa-ga",
    );
    ja.meta.path = "ja/wa-ga/rule.json";
    ja.translations[0].path = "ja/wa-ga/uz.mdx";
    const { corpus: c, problems } = parseCorpus(corpus({ rules: [ja] }));
    assert.deepEqual(problems, []);
    assert.equal(publicTranslations(c).length, 0);
  });

  it("ID tili, kategoriya, daraja tizimi va ruleId mosligini tekshiradi", () => {
    has(problemsOf(corpus({ rules: [ruleFiles(meta({ id: "gr_ja_000001" }), trData({ ruleId: "gr_ja_000001" }))] })), "mos emas");
    has(problemsOf(corpus({ rules: [ruleFiles(meta({ category: "nope" }), trData())] })), "noma'lum kategoriya");
    has(problemsOf(corpus({ rules: [ruleFiles(meta({ level: { system: "jlpt", value: "N5" } }), trData())] })), "daraja tizimi mos emas");
    has(problemsOf(corpus({ rules: [ruleFiles(meta({ level: { system: "cefr", value: "Z9" } }), trData())] })), "noto'g'ri daraja");
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), trData({ ruleId: "gr_en_000009" }))] })), "rule.json ID");
  });

  it("takroriy ID va slug'ni topadi", () => {
    const a = ruleFiles(meta(), trData());
    const b = ruleFiles(meta({ slug: "other" }), trData(), undefined, "other");
    has(problemsOf(corpus({ rules: [a, b] })), "ID takrorlangan");
    const c = ruleFiles(meta({ id: "gr_en_000002" }), trData({ ruleId: "gr_en_000002" }), undefined, "dup");
    has(problemsOf(corpus({ rules: [a, c] })), "slug takrorlangan");
  });

  it("noto'g'ri fayl nomi, tushuntirish tili va blok turini rad etadi", () => {
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), trData(), undefined, "present-perfect", "ru.mdx")] })), "fayl nomi");
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), trData({ explanationLang: "ru" }), undefined, "present-perfect", "ru.mdx")] })), "ruxsat etilmagan");
    const declension = { kind: "declension", rows: [{ case: "Gen", singular: "a", plural: "b" }] };
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), trData({ blocks: [declension] }))] })), "ruxsat etilmagan");
  });

  it("jadval qatorlari sarlavhaga mos bo'lishi kerak", () => {
    const table = { kind: "table", headers: ["A", "B"], rows: [["1"]] };
    has(problemsOf(corpus({ rules: [ruleFiles(meta(), trData({ blocks: [table] }))] })), "ustunlari soni");
  });

  it("MDX tanasidagi xavfli kodni topadi", () => {
    const issues = problemsOf(corpus({ rules: [ruleFiles(meta(), trData(), "<script>x</script>\n")] }));
    has(issues, "ruxsat etilmagan teg");
  });

  it("noma'lum maydonlarni rad etadi (strict)", () => {
    has(problemsOf(corpus({ rules: [ruleFiles(meta({ extra: 1 }), trData())] })), "extra");
  });
});

// ───────── slug o'zgarishi, redirect, ID yo'qolmasligi

describe("barqarorlik", () => {
  const redirectsText = (redirects: unknown[], retired: unknown[] = []) => ({
    path: "redirects.json",
    text: JSON.stringify({ schemaVersion: 1, redirects, retired }),
  });

  it("slug o'zgarsa ID saqlanadi, eski slug redirect orqali topiladi", () => {
    const renamed = ruleFiles(meta({ slug: "present-perfect-simple" }), trData());
    const raw = corpus({
      rules: [renamed],
      redirects: redirectsText([{ lang: "en", from: "present-perfect", id: "gr_en_000001" }]),
    });
    const { corpus: c, problems } = parseCorpus(raw);
    assert.deepEqual(problems, []);
    const m = buildManifest(c);
    assert.deepEqual(resolveSlug(m, "en", "present-perfect"), { id: "gr_en_000001", slug: "present-perfect-simple", redirected: true });
    assert.deepEqual(resolveSlug(m, "en", "present-perfect-simple"), { id: "gr_en_000001", slug: "present-perfect-simple", redirected: false });
    assert.equal(resolveSlug(m, "en", "missing"), null);
  });

  it("redirect jonli slug bilan to'qnashsa yoki maqsadi yo'q bo'lsa rad etiladi", () => {
    has(problemsOf(corpus({ redirects: redirectsText([{ lang: "en", from: "present-perfect", id: "gr_en_000001" }]) })), "to'qnashadi");
    has(problemsOf(corpus({ redirects: redirectsText([{ lang: "en", from: "old", id: "gr_en_000099" }]) })), "maqsadi topilmadi");
  });

  it("manifestdagi ID o'chirilsa xato; retired qilinsa ruxsat", () => {
    const committed = serializeManifest(buildManifest(parseCorpus(corpus()).corpus));
    const withoutRule = corpus({ rules: [], committedManifest: { path: "manifest.json", text: committed } });
    has(problemsOf(withoutRule), "ID yo'qolgan");
    const retired = corpus({
      rules: [],
      committedManifest: { path: "manifest.json", text: committed },
      redirects: redirectsText([], [{ id: "gr_en_000001", reason: "Birlashtirildi", retiredAt: "2026-10-15" }]),
    });
    assert.deepEqual(problemsOf(retired), []);
  });

  it("retired ID qayta ishlatilsa xato", () => {
    const raw = corpus({
      redirects: redirectsText([], [{ id: "gr_en_000001", reason: "Eski", retiredAt: "2026-10-15" }]),
    });
    has(problemsOf(raw), "nafaqaga chiqarilgan");
  });

  it("manifest deterministik", () => {
    const a = serializeManifest(buildManifest(parseCorpus(corpus()).corpus));
    const b = serializeManifest(buildManifest(parseCorpus(corpus()).corpus));
    assert.equal(a, b);
  });
});

// ───────── haqiqiy kontent

describe("content/grammar", () => {
  const root = join(process.cwd(), "content", "grammar");
  const { corpus: c, problems } = parseCorpus(readRawCorpus(root));

  it("muammosiz", () => {
    assert.deepEqual(problems, []);
    assert.ok(c.rules.length >= 2);
  });
  it("hozircha hech bir qoida approved emas (metodist tasdig'i kutilmoqda)", () => {
    // Bu test pilotlar tasdiqlangach ataylab yangilanadi.
    assert.equal(publicTranslations(c).length, 0);
  });
});
