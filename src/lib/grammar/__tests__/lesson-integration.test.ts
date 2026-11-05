import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseBackTarget } from "../back.ts";
import { parseCorpus, type RawCorpus } from "../corpus.ts";
import { readRawCorpus } from "../fs-source.ts";
import { buildPublicData, publicDataSchema } from "../public-data.ts";
import { approved, REVIEWERS_RAW } from "./helpers.ts";
import { buildRegistry, canonicalize, computeVersion, serverModuleSource } from "../registry.ts";
import { decideGrammarRoute } from "../routing.ts";
import { createStore } from "../store.ts";

// ───────── fixture yordamchilari

const LANGS = {
  schemaVersion: 1,
  explanationLanguages: ["uz"],
  languages: {
    en: { name: "English", nativeName: "English", enabled: true, dir: "ltr", levelSystem: "cefr", scripts: ["Latn"], blocks: ["table"], categories: [{ id: "tenses", title: { uz: "Zamonlar" } }] },
    ru: { name: "Russian", nativeName: "Русский", enabled: false, dir: "ltr", levelSystem: "cefr", scripts: ["Cyrl"], blocks: ["table"], categories: [{ id: "gender", title: { uz: "Rodlar" } }] },
  },
};

type R = { n: number; lang: "en" | "ru"; slug: string; status: "draft" | "review" | "approved"; title: string };
const ex = (lang: "en" | "ru") => (lang === "en" ? [{ text: "I read.", translation: "Men o‘qiyman." }, { text: "She reads.", translation: "U o‘qiydi." }] : [{ text: "Я читаю.", translation: "Men o‘qiyman." }, { text: "Она читает.", translation: "U o‘qiydi." }]);

function raw(rules: R[], redirects: unknown[] = [], retired: unknown[] = []): RawCorpus {
  return {
    languages: { path: "languages.json", text: JSON.stringify(LANGS) },
    reviewers: REVIEWERS_RAW,
    redirects: { path: "redirects.json", text: JSON.stringify({ schemaVersion: 1, redirects, retired }) },
    rules: rules.map((r) => {
      const id = `gr_${r.lang}_${String(r.n).padStart(6, "0")}`;
      return {
        meta: { path: `${r.lang}/${r.slug}/rule.json`, text: JSON.stringify({ schemaVersion: 1, id, lang: r.lang, slug: r.slug, category: r.lang === "en" ? "tenses" : "gender", related: [] }) },
        translations: [
          {
            path: `${r.lang}/${r.slug}/uz.mdx`,
            text: (() => {
              const body = "Tana MAXFIY-MATN\n";
              const data = { ruleId: id, explanationLang: "uz", status: r.status, revision: 1, title: r.title, summary: "S", formulas: [], examples: ex(r.lang), exceptions: [], commonMistakes: [], blocks: [] };
              const final = r.status === "approved" ? approved(data, body) : data;
              return `---\n${JSON.stringify(final)}\n---\n\n${body}`;
            })(),
          },
        ],
      };
    }),
  };
}

const rules: R[] = [
  { n: 1, lang: "en", slug: "present-perfect", status: "approved", title: "Present Perfect" },
  { n: 2, lang: "en", slug: "articles", status: "review", title: "Articles" },
  { n: 3, lang: "en", slug: "first-conditional", status: "draft", title: "First Conditional" },
  { n: 4, lang: "en", slug: "new-slug", status: "approved", title: "Yangi nom" },
  { n: 1, lang: "ru", slug: "gender", status: "approved", title: "Род" },
];
const retired = [
  { id: "gr_en_000090", reason: "Birlashtirildi", retiredAt: "2026-02-01", replacedBy: "gr_en_000004" },
  { id: "gr_en_000091", reason: "Eskirgan", retiredAt: "2026-02-01" },
  { id: "gr_en_000092", reason: "Boshqa til", retiredAt: "2026-02-01", replacedBy: "gr_en_000002" },
];
const redirects = [{ lang: "en", from: "old-present-perfect", id: "gr_en_000001" }];

const parsed = parseCorpus(raw(rules, redirects, retired));

describe("reyestr generatori (server uchun)", () => {
  it("korpus muammosiz", () => assert.deepEqual(parsed.problems, []));
  const reg = buildRegistry(parsed.corpus);

  it("holatlar: approved > review > draft; sarlavha faqat approved uchun", () => {
    const by = new Map(reg.rules.map((r) => [r.id, r]));
    assert.equal(by.get("gr_en_000001")?.status, "approved");
    assert.equal(by.get("gr_en_000001")?.title, "Present Perfect");
    assert.equal(by.get("gr_en_000002")?.status, "review");
    assert.equal(by.get("gr_en_000002")?.title, null);
    assert.equal(by.get("gr_en_000003")?.status, "draft");
    assert.equal(by.get("gr_en_000003")?.title, null);
  });
  it("tillar: yoqilgan/yoqilmagan bayrog'i reyestrda", () => {
    assert.deepEqual(reg.languages.find((l) => l.code === "ru"), { code: "ru", name: "Russian", enabled: false });
    assert.equal(reg.languages.find((l) => l.code === "en")?.enabled, true);
  });
  it("nafaqaga chiqarilganlar replacedBy bilan", () => {
    assert.deepEqual(reg.retired.find((t) => t.id === "gr_en_000090"), { id: "gr_en_000090", replacedBy: "gr_en_000004" });
    assert.deepEqual(reg.retired.find((t) => t.id === "gr_en_000091"), { id: "gr_en_000091", replacedBy: null });
  });
  it("kontent matni, misollar va slug tarjimalari reyestrga tushmaydi", () => {
    const json = JSON.stringify(reg);
    assert.ok(!json.includes("MAXFIY-MATN"));
    assert.ok(!json.includes("I read."));
    assert.ok(!json.includes("review\":{"));
  });
  it("versiya deterministik va mazmun o'zgarsa o'zgaradi", () => {
    assert.equal(buildRegistry(parsed.corpus).version, reg.version);
    const changed = buildRegistry(parseCorpus(raw(rules.map((r) => (r.n === 2 && r.lang === "en" ? { ...r, status: "approved" as const } : r)), redirects, retired)).corpus);
    assert.notEqual(changed.version, reg.version);
  });
  it("versiya kalit tartibiga bog'liq emas (kanonik serializatsiya)", () => {
    const a = { x: 1, y: { b: 2, a: 1 } };
    const b = { y: { a: 1, b: 2 }, x: 1 };
    assert.equal(canonicalize(a), canonicalize(b));
    const { version, ...rest } = reg;
    assert.equal(computeVersion(rest), version);
  });
  it("server moduli versiya va ma'lumotni o'z ichiga oladi", () => {
    const src = serverModuleSource(reg);
    assert.ok(src.includes(`"version": "${reg.version}"`));
    assert.ok(src.startsWith("// AUTO-GENERATED"));
  });
});

describe("doimiy ID bo'yicha routing (darsdan kelgan havolalar)", () => {
  const store = createStore(publicDataSchema.parse(JSON.parse(JSON.stringify(buildPublicData(parsed.corpus)))));
  it("ID → joriy slug (308); slug o'zgarsa ham havola buzilmaydi", () => {
    assert.deepEqual(decideGrammarRoute("/grammar/en/gr_en_000001", store), { kind: "redirect", to: "/grammar/en/present-perfect" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/gr_en_000004", store), { kind: "redirect", to: "/grammar/en/new-slug" });
  });
  it("eski slug ham ID orqali joriy slug'ga", () => {
    assert.deepEqual(decideGrammarRoute("/grammar/en/old-present-perfect", store), { kind: "redirect", to: "/grammar/en/present-perfect" });
  });
  it("nafaqaga chiqarilgan ID → almashtiruvchi qoida; almashtiruvchisiz → 404", () => {
    assert.deepEqual(decideGrammarRoute("/grammar/en/gr_en_000090", store), { kind: "redirect", to: "/grammar/en/new-slug" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/gr_en_000091", store), { kind: "notFound" });
  });
  it("review/draft ID, noma'lum ID, yoqilmagan til → 404 (ommaviy ma'lumotda yo'q)", () => {
    for (const id of ["gr_en_000002", "gr_en_000003", "gr_en_000999"]) {
      assert.deepEqual(decideGrammarRoute(`/grammar/en/${id}`, store), { kind: "notFound" }, id);
    }
    assert.deepEqual(decideGrammarRoute("/grammar/ru/gr_ru_000001", store), { kind: "notFound" });
  });
  it("retired → review qoidaga almashtirish ommaviy emas → 404", () => {
    assert.deepEqual(decideGrammarRoute("/grammar/en/gr_en_000092", store), { kind: "notFound" });
  });
  it("til mos kelmasa (gr_ru ID /grammar/en/ ostida) → 404 emas, tilga yo'naltirilmaydi", () => {
    // ID boshqa tilga tegishli bo'lsa ham resolveId topadi: yo'naltirish ID tiliga qarab (xavfsiz, ichki)
    const d = decideGrammarRoute("/grammar/en/gr_ru_000001", store);
    assert.ok(d.kind === "notFound" || (d.kind === "redirect" && d.to.startsWith("/grammar/")));
  });
});

describe("darsga qaytish (open redirect yo'q)", () => {
  const U = "123e4567-e89b-12d3-a456-426614174000";
  it("o'quvchi: lesson+page", () => {
    assert.deepEqual(parseBackTarget({ lesson: U, page: "p_abc-1" }), { href: `/student/lesson/${U}?page=p_abc-1`, label: "Darsga qaytish" });
  });
  it("o'quvchi: sahifasiz", () => {
    assert.equal(parseBackTarget({ lesson: U })?.href, `/student/lesson/${U}`);
  });
  it("ustoz muharriri (preview)", () => {
    assert.deepEqual(parseBackTarget({ studio: U }), { href: `/teacher/lessons/${U}`, label: "Muharrirga qaytish" });
  });
  it("tashqi URL va yaroqsiz qiymatlar rad etiladi", () => {
    for (const lesson of ["https://evil.com", "//evil.com", "javascript:alert(1)", "../../etc", `${U}/../x`, "", "1"]) {
      assert.equal(parseBackTarget({ lesson }), null, lesson);
    }
    assert.equal(parseBackTarget({ studio: "https://evil.com" }), null);
    assert.equal(parseBackTarget({ lesson: [U, "x"] }), null);
    assert.equal(parseBackTarget({}), null);
  });
  it("yaroqsiz page tashlab yuboriladi (lekin lesson saqlanadi)", () => {
    for (const page of ["https://evil.com", "a/b", "a?b=1", "x".repeat(41), "<script>"]) {
      assert.equal(parseBackTarget({ lesson: U, page })?.href, `/student/lesson/${U}`, page);
    }
  });
  it("natija doim ichki yo'l", () => {
    const t = parseBackTarget({ lesson: U, page: "p1" })!;
    assert.ok(t.href.startsWith("/student/lesson/") && !t.href.includes("//") && !/^https?:/.test(t.href));
  });
});

describe("repo'lar mosligi (deploy darvozasi)", () => {
  const serverFile = join(process.cwd(), "..", "server", "src", "grammar", "grammar-registry.data.ts");
  const real = parseCorpus(readRawCorpus(join(process.cwd(), "content", "grammar")));

  it("client reyestri real kontentdan hosil qilinadi va muammosiz", () => assert.deepEqual(real.problems, []));
  it("server repo'sidagi reyestr client bilan bir xil versiyada (mavjud bo'lsa)", { skip: !existsSync(serverFile) }, () => {
    const expected = serverModuleSource(buildRegistry(real.corpus));
    assert.equal(readFileSync(serverFile, "utf8"), expected, "npm run grammar:export-registry ni ishga tushiring");
  });
  it("real reyestrda hech bir qoida approved emas (pilotlar review)", () => {
    const reg = buildRegistry(real.corpus);
    assert.ok(reg.rules.every((r) => r.status !== "approved"));
    assert.ok(reg.rules.every((r) => r.title === null));
  });
});
