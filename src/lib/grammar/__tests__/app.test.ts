import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { parseCorpus } from "../corpus.ts";
import { readRawCorpus } from "../fs-source.ts";
import { parseInline, parseMarkdown, safeHref } from "../markdown.ts";
import { buildPublicData, publicDataSchema, serializePublicData } from "../public-data.ts";
import { decideGrammarRoute } from "../routing.ts";
import { filterEntries, normalize, search, type IndexEntry } from "../search.ts";
import { createStore } from "../store.ts";

const FIXTURE_ROOT = join(process.cwd(), "src", "lib", "grammar", "__fixtures__", "content");
const fixture = parseCorpus(readRawCorpus(FIXTURE_ROOT));
const publicData = publicDataSchema.parse(JSON.parse(serializePublicData(buildPublicData(fixture.corpus))));
const store = createStore(publicData);

describe("fixture korpusi", () => {
  it("muammosiz", () => assert.deepEqual(fixture.problems, []));
});

describe("ommaviy ma'lumot (statuslar)", () => {
  it("faqat approved qoidalar kiradi; draft/review hech qachon", () => {
    assert.deepEqual(publicData.rules.map((r) => r.slug).sort(), [
      "fixture-articles",
      "fixture-kelishiklar",
      "fixture-long-table",
      "fixture-present-perfect",
      "fixture-te-form",
    ]);
    const json = serializePublicData(buildPublicData(fixture.corpus));
    assert.ok(!/LEAK|SECRET/.test(json), "draft/review matni chiqib ketdi");
  });
  it("draft/review'ga ishora qiluvchi related olib tashlanadi", () => {
    const pp = publicData.rules.find((r) => r.slug === "fixture-present-perfect")!;
    assert.deepEqual(pp.related, ["gr_en_000102"]);
  });
  it("fixture'da yoqilgan tillar ommaviy ma'lumotda; real kontentda ru/ja yoqilmagan", () => {
    assert.deepEqual(publicData.languages.map((l) => l.code), ["en", "ja", "ru"]);
    const real = parseCorpus(readRawCorpus(join(process.cwd(), "content", "grammar")));
    assert.deepEqual(buildPublicData(real.corpus).languages.map((l) => l.code), ["en"]);
  });
  it("tasdiqlangan qoida bo'lmasa bo'sh, lekin yaroqli", () => {
    const real = parseCorpus(readRawCorpus(join(process.cwd(), "content", "grammar")));
    assert.deepEqual(real.problems, []);
    const d = buildPublicData(real.corpus);
    assert.equal(d.rules.length, 0);
    assert.doesNotThrow(() => publicDataSchema.parse(d));
    assert.ok(d.languages.length >= 1);
  });
});

describe("routing qarori", () => {
  it("ruxsat / 308 / 404", () => {
    assert.deepEqual(decideGrammarRoute("/grammar", store), { kind: "pass" });
    assert.deepEqual(decideGrammarRoute("/grammar/en", store), { kind: "pass" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/fixture-articles", store), { kind: "pass" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/old-present-perfect", store), {
      kind: "redirect",
      to: "/grammar/en/fixture-present-perfect",
    });
    assert.deepEqual(decideGrammarRoute("/grammar/ru", store), { kind: "pass" });
    assert.deepEqual(decideGrammarRoute("/grammar/xx", store), { kind: "notFound" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/yoq", store), { kind: "notFound" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/a/b", store), { kind: "notFound" });
  });
  it("draft/review slug'lari 404", () => {
    assert.deepEqual(decideGrammarRoute("/grammar/en/fixture-draft-only", store), { kind: "notFound" });
    assert.deepEqual(decideGrammarRoute("/grammar/en/fixture-review-only", store), { kind: "notFound" });
  });
});

describe("store", () => {
  it("tarjima fallback: so'ralgan til yo'q bo'lsa uz", () => {
    const r = store.rule("en", "fixture-articles")!;
    assert.equal(store.translation(r, "ru").lang, "uz");
  });
  it("index faqat ommaviy qoidalar", () => {
    assert.equal(store.index("en").length, 3);
    assert.equal(store.index("ja").length, 1);
    assert.equal(store.index("ru").length, 1);
  });
});

describe("qidiruv va filtr", () => {
  const entries: IndexEntry[] = [
    { id: "1", slug: "present-perfect", title: "Present Perfect", summary: "Tajriba va natija", category: "tenses", level: "A2", terms: "present perfect" },
    { id: "2", slug: "articles", title: "Articles: a, an, the", summary: "Artikllar", category: "articles", level: "A1", terms: "articles" },
    { id: "3", slug: "first-conditional", title: "First Conditional", summary: "Real shart", category: "conditionals", level: "B1", terms: "first conditional" },
  ];
  it("normalize apostrof va registrni tenglashtiradi", () => {
    assert.equal(normalize("O‘zbek  O'zbek"), "ozbek ozbek");
  });
  it("sarlavha bo'yicha va tartiblangan", () => {
    assert.equal(search(entries, "perf")[0].id, "1");
    assert.deepEqual(search(entries, "zzz"), []);
    assert.equal(search(entries, "").length, 3);
  });
  it("barcha so'zlar mos kelishi shart", () => {
    assert.equal(search(entries, "first perfect").length, 0);
  });
  it("kategoriya va daraja filtri", () => {
    assert.deepEqual(filterEntries(entries, { q: "", category: "tenses", level: null }).map((e) => e.id), ["1"]);
    assert.deepEqual(filterEntries(entries, { q: "", category: null, level: "A1" }).map((e) => e.id), ["2"]);
    assert.equal(filterEntries(entries, { q: "articles", category: "tenses", level: null }).length, 0);
  });
});

describe("xavfsiz markdown renderi", () => {
  it("xavfli sxemali havolalar olib tashlanadi", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "vbscript:x", "//evil.com", "/\\evil.com", "http://insecure.com"]) {
      assert.equal(safeHref(bad), null, bad);
    }
    for (const good of ["/grammar/en/x", "https://example.com/a", "mailto:a@b.uz"]) assert.equal(safeHref(good), good);
    const nodes = parseInline("[bos](javascript:alert(1))");
    assert.ok(nodes.every((n) => n.t === "text"), "havola tuguni bo'lmasligi kerak");
    assert.equal(nodes[0].t === "text" && nodes[0].v, "bos");
  });
  it("xom HTML va ifodalar oddiy matn bo'lib qoladi (bajarilmaydi)", () => {
    const blocks = parseMarkdown("<script>alert(1)</script>\n\n{process.env.X}\n");
    assert.deepEqual(blocks.map((b) => b.t), ["p", "p"]);
    const json = JSON.stringify(blocks);
    assert.ok(json.includes("<script>"), "matn sifatida saqlanadi (React escape qiladi)");
    assert.ok(!blocks.some((b) => b.t === "callout" || b.t === "code"));
  });
  it("sarlavha, ro'yxat, callout, kod", () => {
    const blocks = parseMarkdown('## A\n\n- x\n- y\n\n1. bir\n\n<Callout tone="tip">\nMaslahat\n</Callout>\n\n```\n<b>\n```\n');
    assert.deepEqual(blocks.map((b) => b.t), ["h2", "ul", "ol", "callout", "code"]);
    const callout = blocks[3];
    assert.equal(callout.t === "callout" && callout.tone, "tip");
  });
  it("callout ichida callout bo'lmaydi", () => {
    const [b] = parseMarkdown('<Callout>\n<Callout tone="tip">x</Callout>\n</Callout>');
    assert.ok(b.t === "callout" && b.c.every((x) => x.t !== "callout"));
  });
});

describe("izolyatsiya: XP/progress/API'ga tegmaslik", () => {
  const FORBIDDEN = [/@\/server\/api/, /@\/lib\/api/, /@\/features\/(lessons|quiz|notebook)/, /\bfetch\(/, /\bcookies\(/, /\/api\//];
  const roots = [
    join(process.cwd(), "src", "lib", "grammar"),
    join(process.cwd(), "src", "features", "grammar"),
    join(process.cwd(), "src", "app", "(shared)"),
    join(process.cwd(), "src", "app", "grammar-missing"),
  ];
  const files = (p: string): string[] =>
    statSync(p).isDirectory()
      ? readdirSync(p).flatMap((n) => (n === "__tests__" || n === "__fixtures__" ? [] : files(join(p, n))))
      : /\.(ts|tsx)$/.test(p) ? [p] : [];
  const rel = (f: string) => f.replace(process.cwd(), "").split("\\").join("/");

  it("grammatika kodi API/progress modullarini import qilmaydi", () => {
    const hits: string[] = [];
    for (const f of roots.flatMap(files)) {
      const src = readFileSync(f, "utf8");
      // data.ts — YAGONA ruxsat etilgan tarmoq nuqtasi (release rejimi): faqat ichki grammatika API'si
      if (rel(f) === "/src/lib/grammar/data.ts") {
        const apis = [...src.matchAll(/\/api\/[a-z-]+\/[a-z-]+/g)].map((m) => m[0]);
        assert.deepEqual([...new Set(apis)], ["/api/internal/grammar"]);
        continue;
      }
      for (const re of FORBIDDEN) if (re.test(src)) hits.push(`${rel(f)}: ${re}`);
    }
    assert.deepEqual(hits, []);
  });

  it("sessiya (@/server/session) faqat autentifikatsiya qobig'ida", () => {
    const users = roots
      .flatMap(files)
      .filter((f) => readFileSync(f, "utf8").includes("@/server/session"))
      .map(rel)
      .sort();
    assert.deepEqual(users, ["/src/app/(shared)/layout.tsx", "/src/features/grammar/components/StaffShell.tsx"]);
  });
});
