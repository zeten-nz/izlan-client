import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseCorpus, type RawCorpus } from "../corpus.ts";
import { readRawCorpus } from "../fs-source.ts";
import { buildPublicData, publicDataSchema, serializePublicData } from "../public-data.ts";
import { exampleSchema, translationSchema } from "../schema.ts";
import { filterEntries, search, toIndexEntry, type IndexEntry } from "../search.ts";
import { createStore } from "../store.ts";
import { foldForSearch, hasAnyScript, katakanaToHiragana, stripStress } from "../text.ts";

// ───────── Unicode va qidiruv folding

describe("foldForSearch", () => {
  it("rus urg'usi: молоко́ == молоко (NFC va NFD ikkalasi)", () => {
    const stressedNfc = "молоко́";
    const stressedNfd = stressedNfc.normalize("NFD");
    assert.equal(foldForSearch(stressedNfc), "молоко");
    assert.equal(foldForSearch(stressedNfd), "молоко");
    assert.equal(foldForSearch("МОЛОКО́"), "молоко");
  });
  it("ё/е birlashadi, lekin й и dan farqli bo'lib qoladi", () => {
    assert.equal(foldForSearch("Ёлка"), foldForSearch("елка"));
    assert.equal(foldForSearch("ёлка".normalize("NFD")), "елка");
    assert.notEqual(foldForSearch("молодой"), foldForSearch("молодои"));
    assert.equal(foldForSearch("Й".normalize("NFD")), "й");
  });
  it("yapon: katakana → hiragana, to'liq/yarim kenglik, NFC/NFD", () => {
    assert.equal(foldForSearch("カタカナ"), "かたかな");
    assert.equal(foldForSearch("ｶﾀｶﾅ"), "かたかな");
    assert.equal(foldForSearch("ガ".normalize("NFD")), foldForSearch("が"));
    assert.equal(foldForSearch("ＡＢＣ１２３"), "abc123");
    assert.equal(katakanaToHiragana("テケイ"), "てけい");
    assert.equal(foldForSearch("ラーメン"), "らーめん"); // cho'zish belgisi saqlanadi
  });
  it("kanji va lotin o'zgarishsiz (faqat kichik harf)", () => {
    assert.equal(foldForSearch("日本語 Grammar"), "日本語 grammar");
  });
  it("lotin diakritiklari va o'zbek apostroflari", () => {
    assert.equal(foldForSearch("Café"), "cafe");
    assert.equal(foldForSearch("O‘zbek"), foldForSearch("O'zbek"));
    assert.equal(foldForSearch("oʻqituvchi"), "oqituvchi");
  });
  it("stripStress faqat urg'uni olib tashlaydi (ё, й saqlanadi)", () => {
    assert.equal(stripStress("мо́ре"), "море");
    assert.equal(stripStress("ёлка́"), "ёлка");
    assert.equal(stripStress("музе́й"), "музей");
  });
  it("yozuv aniqlash", () => {
    assert.equal(hasAnyScript("Это книга", ["Cyrl"]), true);
    assert.equal(hasAnyScript("This is", ["Cyrl"]), false);
    assert.equal(hasAnyScript("読む", ["Jpan"]), true);
    assert.equal(hasAnyScript("カタカナ", ["Jpan"]), true);
    assert.equal(hasAnyScript("English", ["Jpan", "Cyrl"]), false);
  });
});

describe("qidiruv (ru/ja)", () => {
  const entries: IndexEntry[] = [
    { id: "1", slug: "gender", title: "Молоко́ и род существительных", summary: "Ot jinsi", category: "gender", level: "A1", terms: "род jins" },
    { id: "2", slug: "cases", title: "Падежи", summary: "Kelishiklar", category: "cases", level: "A2", terms: "падеж kelishik склонение" },
    { id: "3", slug: "te", title: "て形 (te-shakl)", summary: "Fe'l shakli", category: "te-form", level: "N5", terms: "てけい te form テ形" },
    { id: "4", slug: "katakana", title: "カタカナ の ルール", summary: "Katakana", category: "particles", level: "N5", terms: "katakana" },
  ];
  it("urg'uli sarlavhani urg'usiz so'rov topadi va aksincha", () => {
    assert.equal(search(entries, "молоко")[0]?.id, "1");
    assert.equal(search(entries, "молоко́")[0]?.id, "1");
    assert.equal(search(entries, "МОЛОКО")[0]?.id, "1");
  });
  it("kalit so'zlar boshqa yozuvda (kirill, kana)", () => {
    assert.equal(search(entries, "падеж")[0]?.id, "2");
    assert.equal(search(entries, "kelishik")[0]?.id, "2");
    assert.equal(search(entries, "てけい")[0]?.id, "3");
    assert.equal(search(entries, "テケイ")[0]?.id, "3");
  });
  it("hiragana so'rov katakana sarlavhani topadi (va aksincha)", () => {
    assert.equal(search(entries, "かたかな")[0]?.id, "4");
    assert.equal(search(entries, "ルール")[0]?.id, "4");
    assert.equal(search(entries, "るーる")[0]?.id, "4");
  });
  it("bo'shliqsiz yapon matnida ichki moslik", () => {
    assert.equal(search(entries, "形")[0]?.id, "3");
  });
  it("daraja filtri (N5) va birlashgan so'rov", () => {
    assert.deepEqual(filterEntries(entries, { q: "", category: null, level: "N5" }).map((e) => e.id).sort(), ["3", "4"]);
    assert.deepEqual(filterEntries(entries, { q: "te", category: null, level: "N5" }).map((e) => e.id), ["3"]);
  });
});

// ───────── schema: ru/ja

const ex = (over: Record<string, unknown> = {}) => ({ text: "Это книга.", translation: "Bu kitob.", ...over });

describe("misol schema'si", () => {
  it("urg'u: urg'usiz holda text ga teng bo'lishi shart", () => {
    assert.ok(exampleSchema.safeParse(ex({ stressed: "Это кни́га." })).success);
    assert.ok(!exampleSchema.safeParse(ex({ stressed: "Это журнал." })).success);
  });
  it("furigana: segmentlar birlashganda text ga teng", () => {
    const ok = { text: "読む", translation: "o‘qimoq", ruby: [{ base: "読", reading: "よ" }, { base: "む" }] };
    assert.ok(exampleSchema.safeParse(ok).success);
    assert.ok(!exampleSchema.safeParse({ ...ok, ruby: [{ base: "書", reading: "か" }, { base: "む" }] }).success);
  });
  it("furigana o'qilishi faqat kana (HTML/lotin rad etiladi)", () => {
    for (const reading of ["yo", "<rt>よ</rt>", "よ<b>", "読"]) {
      const r = exampleSchema.safeParse({ text: "読む", translation: "x", ruby: [{ base: "読", reading }, { base: "む" }] });
      assert.equal(r.success, false, reading);
    }
    assert.ok(exampleSchema.safeParse({ text: "読む", translation: "x", ruby: [{ base: "読", reading: "ヨ" }, { base: "む" }] }).success);
    assert.ok(exampleSchema.safeParse({ text: "本", translation: "x", ruby: [{ base: "本", reading: "ほーん" }] }).success);
  });
  it("noma'lum maydonlar rad etiladi (strict)", () => {
    assert.ok(!exampleSchema.safeParse(ex({ html: "<b>x</b>" })).success);
  });
});

const trBase = {
  ruleId: "gr_ru_000001", explanationLang: "uz", status: "review", revision: 1, title: "T", summary: "S",
  formulas: [], examples: [], exceptions: [], commonMistakes: [],
};

describe("blok schema'si", () => {
  const declension = (rows: unknown[], extra: Record<string, unknown> = {}) =>
    translationSchema.safeParse({ ...trBase, blocks: [{ kind: "declension", rows, ...extra }] });
  const row = (caseId: string, over: Record<string, unknown> = {}) => ({ case: "Падеж", caseId, singular: "кни́га", plural: "кни́ги", ...over });

  it("declension: 6 kelishik, rod, urg'uli shakllar", () => {
    const rows = ["nom", "gen", "dat", "acc", "ins", "prep"].map((c) => row(c));
    assert.ok(declension(rows, { word: "книга", gender: "f" }).success);
  });
  it("declension: noma'lum caseId, takroriy caseId, noto'g'ri rod rad etiladi", () => {
    assert.ok(!declension([row("xxx")]).success);
    assert.ok(!declension([row("nom"), row("nom")]).success);
    assert.ok(!declension([row("nom")], { gender: "x" }).success);
  });
  it("declension: caseId ixtiyoriy (eski kontent bilan mos)", () => {
    assert.ok(declension([{ case: "Именительный", singular: "стол", plural: "столы" }]).success);
  });
  it("conjugation: furigana segmentlari", () => {
    const r = translationSchema.safeParse({
      ...trBase,
      blocks: [{ kind: "conjugation", forms: [{ label: "て形", value: "書いて", ruby: [{ base: "書", reading: "か" }, { base: "いて" }] }] }],
    });
    assert.ok(r.success);
  });
  it("manbalar: faqat https", () => {
    const ok = translationSchema.safeParse({ ...trBase, blocks: [], sources: [{ title: "Manba", url: "https://example.org/a", license: "CC BY-SA 4.0" }] });
    assert.ok(ok.success);
    for (const url of ["http://example.org", "javascript:alert(1)", "ftp://x.y"]) {
      assert.equal(translationSchema.safeParse({ ...trBase, blocks: [], sources: [{ title: "M", url }] }).success, false, url);
    }
  });
});

// ───────── korpus: yozuv tekshiruvi va til cheklovlari

const LANGS = {
  schemaVersion: 1,
  explanationLanguages: ["uz"],
  languages: {
    en: { name: "English", nativeName: "English", enabled: true, dir: "ltr", levelSystem: "cefr", scripts: ["Latn"], blocks: ["table"], categories: [{ id: "tenses", title: { uz: "Z" } }] },
    ru: { name: "Russian", nativeName: "Русский", enabled: true, dir: "ltr", levelSystem: "cefr", scripts: ["Cyrl"], blocks: ["table", "declension"], categories: [{ id: "gender", title: { uz: "R" } }] },
    ja: { name: "Japanese", nativeName: "日本語", enabled: true, dir: "ltr", levelSystem: "jlpt", scripts: ["Jpan"], blocks: ["table", "conjugation"], categories: [{ id: "te-form", title: { uz: "T" } }] },
  },
};
function rawOne(lang: "en" | "ru" | "ja", examples: unknown[], blocks: unknown[] = []): RawCorpus {
  const cat = { en: "tenses", ru: "gender", ja: "te-form" }[lang];
  const id = `gr_${lang}_000001`;
  return {
    languages: { path: "languages.json", text: JSON.stringify(LANGS) },
    redirects: { path: "redirects.json", text: JSON.stringify({ schemaVersion: 1, redirects: [], retired: [] }) },
    rules: [
      {
        meta: { path: `${lang}/r/rule.json`, text: JSON.stringify({ schemaVersion: 1, id, lang, slug: "r", category: cat, related: [] }) },
        translations: [
          {
            path: `${lang}/r/uz.mdx`,
            text: `---\n${JSON.stringify({ ...trBase, ruleId: id, examples, blocks })}\n---\n\nTana\n`,
          },
        ],
      },
    ],
  };
}
const problems = (raw: RawCorpus) => parseCorpus(raw).problems.map((p) => p.message);

describe("til yozuvi tekshiruvi", () => {
  it("ru misoli kirill yozuvini o'z ichiga olishi shart", () => {
    assert.deepEqual(problems(rawOne("ru", [ex()])), []);
    assert.ok(problems(rawOne("ru", [{ text: "This is a book.", translation: "x" }])).some((m) => m.includes("yozuvi")));
  });
  it("ja misoli yapon yozuvini o'z ichiga olishi shart", () => {
    assert.deepEqual(problems(rawOne("ja", [{ text: "本です。", translation: "Bu kitob." }])), []);
    assert.ok(problems(rawOne("ja", [{ text: "Hon desu.", translation: "x" }])).some((m) => m.includes("yozuvi")));
  });
  it("furigana faqat yapon tilida, urg'u faqat kirillda", () => {
    const ruby = [{ base: "Это книга.", reading: "ほん" }];
    assert.ok(problems(rawOne("ru", [ex({ ruby })])).some((m) => m.includes("furigana")));
    assert.ok(problems(rawOne("ja", [{ text: "本です。", translation: "x", stressed: "本です。" }])).some((m) => m.includes("urg'u")));
    assert.ok(problems(rawOne("en", [{ text: "I read.", translation: "x", stressed: "I réad." }])).length > 0);
  });
  it("declension bloki ingliz tilida ruxsat etilmagan (til registri)", () => {
    const block = { kind: "declension", rows: [{ case: "Nom", singular: "a", plural: "b" }] };
    assert.ok(problems(rawOne("en", [{ text: "I read.", translation: "x" }], [block])).some((m) => m.includes("ruxsat etilmagan")));
  });
});

// ───────── fixture va real kontent

const FIXTURE = parseCorpus(readRawCorpus(join(process.cwd(), "src", "lib", "grammar", "__fixtures__", "content")));
const fixtureData = publicDataSchema.parse(JSON.parse(serializePublicData(buildPublicData(FIXTURE.corpus))));
const store = createStore(fixtureData);

describe("ru/ja fixture (ommaviy ma'lumot)", () => {
  it("fixture korpusi muammosiz", () => assert.deepEqual(FIXTURE.problems, []));
  it("ru/ja approved qoidalar bor, draft/review sizib chiqmagan", () => {
    assert.deepEqual(store.rules("ru").map((r) => r.slug), ["fixture-kelishiklar"]);
    assert.deepEqual(store.rules("ja").map((r) => r.slug), ["fixture-te-form"]);
    assert.ok(!serializePublicData(buildPublicData(FIXTURE.corpus)).match(/SECRET|MUST NOT LEAK/));
  });
  it("ru: declension bloki va urg'u ma'lumotda", () => {
    const t = store.translation(store.rule("ru", "fixture-kelishiklar")!).t;
    const d = t.blocks.find((b) => b.kind === "declension");
    assert.ok(d && d.kind === "declension" && d.rows.length === 6 && d.gender === "f");
    assert.ok(t.examples.some((e) => e.stressed));
    assert.deepEqual(t.keywords.includes("падеж"), true);
  });
  it("ja: furigana segmentlari strukturali (xom HTML emas)", () => {
    const t = store.translation(store.rule("ja", "fixture-te-form")!).t;
    const first = t.examples[0];
    assert.ok(first.ruby && first.ruby.map((s) => s.base).join("") === first.text);
    // Gostil kontentdagi '<b>' faqat oddiy matn sifatida saqlanadi (render React orqali escape qilinadi)
    assert.ok(t.examples.some((e) => e.ruby?.some((s) => s.base.includes("<b>"))));
  });
  it("daraja: tasdiqlanmagan (confirmed yo'q) → indeksda levelConfirmed=false", () => {
    const e = toIndexEntry(store.rule("ja", "fixture-te-form")!, "uz")!;
    assert.equal(e.level, "N5");
    assert.equal(e.levelConfirmed, false);
  });
  it("qidiruv: fixture indeksi bo'yicha ru/ja", () => {
    assert.equal(search(store.index("ru"), "падеж").length, 1);
    assert.equal(search(store.index("ru"), "ПАДЕЖИ").length, 1);
    assert.equal(search(store.index("ja"), "テ形").length, 1);
    assert.equal(search(store.index("ja"), "てけい").length, 1);
    assert.equal(search(store.index("en"), "падеж").length, 0);
  });
  it("tillar mustaqil: ru qoidasi en ro'yxatida ko'rinmaydi", () => {
    assert.ok(store.index("en").every((e) => !e.slug.includes("kelishiklar") && !e.slug.includes("te-form")));
  });
});

describe("real kontent: ru/ja pilot", () => {
  const real = parseCorpus(readRawCorpus(join(process.cwd(), "content", "grammar")));
  it("validatsiyadan o'tadi", () => assert.deepEqual(real.problems, []));
  it("hech bir qoida approved emas va ru/ja yoqilmagan (ommaviy emas)", () => {
    const data = buildPublicData(real.corpus);
    assert.equal(data.rules.length, 0);
    assert.deepEqual(data.languages.map((l) => l.code), ["en"]);
    const statuses = real.corpus.rules.flatMap((r) => r.translations.map((t) => t.data.status));
    assert.ok(statuses.every((s) => s !== "approved"));
  });
  it("pilotlar review holatida, daraja tasdiqlanmagan deb belgilangan", () => {
    const ru = real.corpus.rules.find((r) => r.meta.lang === "ru");
    const ja = real.corpus.rules.find((r) => r.meta.lang === "ja");
    assert.equal(ru?.translations[0].data.status, "review");
    assert.equal(ja?.translations[0].data.status, "review");
    assert.notEqual(ru?.meta.level?.confirmed, true);
    assert.notEqual(ja?.meta.level?.confirmed, true);
  });
  it("ID'lar tilga xos va boshqa tillar ID'siga ta'sir qilmaydi", () => {
    const ids = real.corpus.rules.map((r) => r.meta.id).sort();
    assert.ok(ids.includes("gr_en_000001") && ids.includes("gr_ru_000001") && ids.includes("gr_ja_000001"));
  });
});
