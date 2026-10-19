import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseCorpus, type RawCorpus } from "../corpus.ts";
import { readRawCorpus } from "../fs-source.ts";
import { buildManifest, publicTranslations, serializeManifest } from "../manifest.ts";
import { reviewContentHash } from "../review.ts";
import { approved, REVIEWERS_RAW, TEST_AUTHOR, TEST_REVIEWER } from "./helpers.ts";

const LANGS = {
  schemaVersion: 1,
  explanationLanguages: ["uz"],
  languages: {
    en: { name: "English", nativeName: "English", enabled: true, dir: "ltr", levelSystem: "cefr", scripts: ["Latn"], blocks: ["table"], categories: [{ id: "tenses", title: { uz: "Z" } }] },
    ja: { name: "Japanese", nativeName: "日本語", enabled: true, dir: "ltr", levelSystem: "jlpt", scripts: ["Jpan"], blocks: ["table"], categories: [{ id: "te-form", title: { uz: "T" } }] },
  },
};

const BASE = {
  ruleId: "gr_en_000001", explanationLang: "uz", status: "review", revision: 1, title: "Present Perfect", summary: "Qisqa tavsif.",
  formulas: [], exceptions: [], commonMistakes: [], blocks: [],
  examples: [{ text: "I have finished.", translation: "Men tugatdim." }, { text: "She has left.", translation: "U ketdi." }],
};

type Opts = {
  data?: Record<string, unknown>;
  body?: string;
  ruleOver?: Record<string, unknown>;
  committed?: unknown;
  reviewers?: boolean;
  lang?: "en" | "ja";
};
function corpusFor(o: Opts = {}): RawCorpus {
  const lang = o.lang ?? "en";
  const id = lang === "en" ? "gr_en_000001" : "gr_ja_000001";
  const cat = lang === "en" ? "tenses" : "te-form";
  const body = o.body ?? "Matn.\n";
  const data = { ...BASE, ruleId: id, ...(lang === "ja" ? { examples: [{ text: "本です。", translation: "Kitob." }, { text: "私です。", translation: "Men." }] } : {}), ...(o.data ?? {}) };
  return {
    languages: { path: "languages.json", text: JSON.stringify(LANGS) },
    redirects: { path: "redirects.json", text: JSON.stringify({ schemaVersion: 1, redirects: [], retired: [] }) },
    reviewers: o.reviewers === false ? undefined : REVIEWERS_RAW,
    committedManifest: o.committed ? { path: "manifest.json", text: JSON.stringify(o.committed) } : undefined,
    rules: [
      {
        meta: { path: `${lang}/r/rule.json`, text: JSON.stringify({ schemaVersion: 1, id, lang, slug: "r", category: cat, related: [], ...(o.ruleOver ?? {}) }) },
        translations: [{ path: `${lang}/r/uz.mdx`, text: `---\n${JSON.stringify(data)}\n---\n\n${body}` }],
      },
    ],
  };
}
const approvedFor = (over: Parameters<typeof approved>[2] = {}, extra: Record<string, unknown> = {}, body = "Matn.\n") => approved({ ...BASE, ...extra }, body, over);
const problems = (raw: RawCorpus) => parseCorpus(raw).problems.map((p) => p.message);
const has = (list: string[], part: string) => assert.ok(list.some((m) => m.includes(part)), `'${part}' topilmadi:\n${list.join("\n")}`);

describe("approved siyosati", () => {
  it("to'liq va mos approved o'tadi va ommaviy bo'ladi", () => {
    const raw = corpusFor({ data: approvedFor() });
    const r = parseCorpus(raw);
    assert.deepEqual(r.problems, []);
    assert.equal(publicTranslations(r.corpus).length, 1);
  });

  it("muallif, manba va litsenziya majburiy", () => {
    const base = approvedFor();
    const noAuthor = { ...base };
    delete (noAuthor as Record<string, unknown>).author;
    has(problems(corpusFor({ data: noAuthor })), "muallif");
    has(problems(corpusFor({ data: { ...base, sources: [] } })), "kamida bitta manba");
    has(problems(corpusFor({ data: { ...base, sources: [{ title: "X" }] } })), "litsenziya");
  });

  it("reviewer reviewers.json'da bo'lishi shart (reyestr bo'sh bo'lsa hech kim tasdiqlay olmaydi)", () => {
    has(problems(corpusFor({ data: approvedFor({ reviewer: "somebody" }) })), "reviewers.json'da yo'q");
    has(problems(corpusFor({ data: approvedFor(), reviewers: false })), "reviewers.json'da yo'q");
  });

  it("reviewer faqat o'z tillari uchun", () => {
    const raw = corpusFor({ data: approvedFor(), lang: "ja" });
    raw.reviewers = {
      path: "reviewers.json",
      text: JSON.stringify({ schemaVersion: 1, reviewers: [{ id: TEST_REVIEWER, name: "T", role: "methodist", languages: ["en"], addedAt: "2026-01-01", appointedBy: "t" }] }),
    };
    // ja qoidasi uchun mos approved ma'lumot
    const jaData = approved({ ...BASE, ruleId: "gr_ja_000001", examples: [{ text: "本です。", translation: "Kitob." }, { text: "私です。", translation: "Men." }] });
    raw.rules[0].translations[0].text = `---\n${JSON.stringify(jaData)}\n---\n\nMatn.\n`;
    has(problems(raw), "tayinlanmagan");
  });

  it("muallif o'z kontentini tasdiqlay olmaydi", () => {
    has(problems(corpusFor({ data: approvedFor({ author: TEST_REVIEWER }) })), "o'zi tasdiqlay olmaydi");
  });

  it("reviewer bandlari hammasi true bo'lishi shart", () => {
    const d = approvedFor({ checks: { grammar: true, examples: false, translations: true, level: true } });
    has(problems(corpusFor({ data: d })), "'examples' bandini tasdiqlamagan");
  });

  it("tekshirilgan tahrir joriy tahrirga mos bo'lishi shart", () => {
    const d = { ...approvedFor(), revision: 2 }; // kontent revision oshirildi, lekin review eski tahrirga
    has(problems(corpusFor({ data: d })), "qayta tekshiruv kerak");
  });

  it("tasdiqlangandan keyin kontent (frontmatter yoki tana) o'zgarsa xesh mos kelmaydi", () => {
    const d = approvedFor();
    has(problems(corpusFor({ data: { ...d, summary: "O'zgartirilgan tavsif." } })), "contentHash mos emas");
    has(problems(corpusFor({ data: d, body: "Boshqa matn.\n" })), "contentHash mos emas");
    has(problems(corpusFor({ data: approvedFor({ hash: "0000000000000000" }) })), "contentHash mos emas");
  });

  it("status/review o'zgarishi xeshga ta'sir qilmaydi; CRLF va LF bir xil", () => {
    const fm: Record<string, unknown> = { ...BASE, author: "a" };
    const h = reviewContentHash(fm, "Matn.\n");
    assert.equal(reviewContentHash({ ...fm, status: "approved", review: { x: 1 } }, "Matn.\n"), h);
    assert.equal(reviewContentHash(fm, "Matn.\r\n"), h);
    assert.notEqual(reviewContentHash({ ...fm, title: "Boshqa" }, "Matn.\n"), h);
  });

  it("review/draft holatiga reviewer talab qilinmaydi (qoralama jarayoni)", () => {
    assert.deepEqual(problems(corpusFor({ reviewers: false })), []);
    assert.deepEqual(problems(corpusFor({ data: { status: "draft", review: { reviewedBy: "x" } }, reviewers: false })), []);
  });
});

describe("versiyalash va daraja", () => {
  const manifestOf = (raw: RawCorpus) => JSON.parse(serializeManifest(buildManifest(parseCorpus(raw).corpus)));

  it("manifest contentHash va reviewedBy'ni saqlaydi", () => {
    const m = manifestOf(corpusFor({ data: approvedFor() }));
    assert.match(m.rules[0].translations[0].contentHash, /^[0-9a-f]{16}$/);
    assert.equal(m.rules[0].translations[0].reviewedBy, TEST_REVIEWER);
  });

  it("kontent o'zgarsa revision oshirilishi shart", () => {
    const before = manifestOf(corpusFor({ data: { ...BASE, summary: "Birinchi variant." } }));
    const changedSame = corpusFor({ data: { ...BASE, summary: "Ikkinchi variant." }, committed: before });
    has(problems(changedSame), "revision oshirilmagan");
    const bumped = corpusFor({ data: { ...BASE, summary: "Ikkinchi variant.", revision: 2 }, committed: before });
    assert.deepEqual(problems(bumped), []);
  });

  it("kontent o'zgarmasa revision talab qilinmaydi; eski formatdagi manifest (hash'siz) bilan mos", () => {
    const same = manifestOf(corpusFor());
    assert.deepEqual(problems(corpusFor({ committed: same })), []);
    const legacy = { schemaVersion: 1, rules: [{ id: "gr_en_000001", translations: [{ lang: "uz", status: "review", revision: 1 }] }] };
    assert.deepEqual(problems(corpusFor({ committed: legacy })), []);
  });

  it("daraja 'confirmed: true' faqat approved tarjimasi bor qoidada", () => {
    const lvl = { level: { system: "cefr", value: "A2", confirmed: true } };
    has(problems(corpusFor({ ruleOver: lvl })), "confirmed: true");
    assert.deepEqual(problems(corpusFor({ ruleOver: lvl, data: approvedFor() })), []);
  });
});

describe("real kontent", () => {
  const real = parseCorpus(readRawCorpus(join(process.cwd(), "content", "grammar")));
  it("validatsiyadan o'tadi", () => assert.deepEqual(real.problems, []));
  it("reviewers.json mavjud va hozircha bo'sh: hech kim tasdiqlash huquqiga ega emas", () => {
    assert.ok(real.corpus.reviewers);
    assert.equal(real.corpus.reviewers!.reviewers.length, 0);
  });
  it("hech bir real qoida approved emas va hech qanday tekshiruvchi nomi to'qilmagan", () => {
    for (const r of real.corpus.rules) for (const t of r.translations) assert.notEqual(t.data.status, "approved");
    assert.deepEqual(publicTranslations(real.corpus), []);
  });
  it("muallif maydoni: pilotlar AI qoralamasi deb belgilangan", () => {
    for (const r of real.corpus.rules) for (const t of r.translations) assert.match(t.data.author ?? "", /AI/);
  });
  it("approved qilib bo'lmaydi: pilotni approved qilish urinishi rad etiladi", () => {
    const raw = readRawCorpus(join(process.cwd(), "content", "grammar"));
    const f = raw.rules[0].translations[0];
    const fm = JSON.parse(f.text.split("\n---\n")[0].replace(/^---\n/, ""));
    const forged = { ...fm, status: "approved", author: TEST_AUTHOR, sources: [{ title: "X", license: "original" }], review: { reviewedBy: "fake-methodist", reviewedAt: "2026-10-15", reviewedRevision: fm.revision, contentHash: "0123456789abcdef", checks: { grammar: true, examples: true, translations: true, level: true } } };
    raw.rules[0].translations[0] = { ...f, text: `---\n${JSON.stringify(forged)}\n---\n\nTana\n` };
    const p = parseCorpus(raw).problems.map((x) => x.message);
    has(p, "reviewers.json'da yo'q");
    has(p, "contentHash mos emas");
  });
});
