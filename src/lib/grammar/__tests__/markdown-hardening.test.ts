import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCorpus, type RawCorpus } from "../corpus.ts";
import { lintMdxBody } from "../mdx-lint.ts";
import { parseInline, parseMarkdown, safeHref, type Block, type Inline } from "../markdown.ts";

// ───────── yordamchilar

function walkInline(nodes: Inline[], visit: (n: Inline) => void): void {
  for (const n of nodes) {
    visit(n);
    if (n.t === "strong" || n.t === "em" || n.t === "link") walkInline(n.c, visit);
  }
}
function walkBlocks(blocks: Block[], visit: (n: Inline) => void): void {
  for (const b of blocks) {
    if (b.t === "p" || b.t === "h2" || b.t === "h3") walkInline(b.c, visit);
    else if (b.t === "ul" || b.t === "ol") b.items.forEach((it) => walkInline(it, visit));
    else if (b.t === "callout") walkBlocks(b.c, visit);
  }
}
const textOf = (nodes: Inline[]): string =>
  nodes.map((n) => (n.t === "text" || n.t === "code" ? n.v : textOf(n.c))).join("");
const timed = (fn: () => void): number => {
  const t = performance.now();
  fn();
  return performance.now() - t;
};

// Deterministik psevdo-tasodifiy generator (testlar takrorlanuvchan bo'lsin)
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

// ───────── fuzz va ishlash

describe("parser: fuzz va ishlash", () => {
  const ALPHABET = ["*", "**", "`", "[", "]", "(", ")", "<", ">", "Callout", "/Callout", "tone=\"tip\"", "javascript:", "https://a.b", "\n", "\n\n", "- ", "1. ", "## ", "```", "\\", "{", "}", " ", "a", "é", "日本", "🙂", "​", "́", "م"];

  it("tasodifiy kirishda hech qachon xato bermaydi va havolalar xavfsiz", () => {
    const rand = rng(12345);
    for (let i = 0; i < 4000; i++) {
      const len = 1 + Math.floor(rand() * 60);
      let src = "";
      for (let j = 0; j < len; j++) src += ALPHABET[Math.floor(rand() * ALPHABET.length)];
      let blocks: Block[] = [];
      assert.doesNotThrow(() => (blocks = parseMarkdown(src)), JSON.stringify(src));
      walkBlocks(blocks, (n) => {
        if (n.t === "link") assert.notEqual(safeHref(n.href), null, `xavfli havola: ${n.href} <- ${JSON.stringify(src)}`);
      });
    }
  });

  const ADVERSARIAL: [string, string][] = [
    ["[ ketma-ket", "[".repeat(20_000)],
    ["[a]( ketma-ket", "[a](".repeat(5_000)],
    ["** ketma-ket", "**a".repeat(6_000)],
    ["* ketma-ket", "*a ".repeat(6_000)],
    ["` ketma-ket", "`".repeat(20_000)],
    ["<Callout> ketma-ket", "<Callout>".repeat(2_200)],
    ["ro'yxat", "- x\n".repeat(5_000)],
    ["bo'sh satrlar", "\n".repeat(20_000)],
    ["uzun bitta so'z", "a".repeat(20_000)],
    ["** va [ aralash", "**[a**](".repeat(2_000)],
  ];
  for (const [name, src] of ADVERSARIAL) {
    it(`ReDoS yo'q: ${name} (<1s)`, () => {
      assert.equal(src.length <= 20_000 + 100, true);
      const ms = timed(() => parseMarkdown(src));
      assert.ok(ms < 1000, `${ms.toFixed(0)}ms`);
    });
  }
});

// ───────── noto'g'ri sintaksis

describe("parser: noto'g'ri sintaksis", () => {
  it("yopilmagan belgilar oddiy matn bo'lib qoladi", () => {
    for (const src of ["**qalin", "`kod", "[yorliq](manzil", "[yorliq]", "*kursiv", "(https://x.y)"]) {
      const blocks = parseMarkdown(src);
      assert.equal(blocks.length, 1, src);
      let hasLink = false;
      walkBlocks(blocks, (n) => { if (n.t === "link") hasLink = true; });
      assert.equal(hasLink, false, src);
    }
  });
  it("bo'sh yorliqli havola havola emas", () => {
    let links = 0;
    walkBlocks(parseMarkdown("[](/x)"), (n) => { if (n.t === "link") links++; });
    assert.equal(links, 0);
  });
  it("yopilmagan Callout oxirigacha davom etadi, ortiqcha </Callout> matn", () => {
    const [b] = parseMarkdown('<Callout tone="warning">\nBir\n\nIkki');
    assert.ok(b.t === "callout" && b.c.length === 2);
    const blocks = parseMarkdown("matn </Callout>");
    assert.equal(blocks.length, 1);
  });
  it("noma'lum tone 'info'ga tushadi emas, oddiy matn bo'ladi", () => {
    const [b] = parseMarkdown('<Callout tone="evil">x</Callout>');
    assert.equal(b.t, "p"); // regex faqat info|warning|tip ni taniydi
  });
  it("yopilmagan kod bloki oxirigacha kod", () => {
    const [b] = parseMarkdown("```\n<script>x</script>\nqolgan");
    assert.ok(b.t === "code" && b.v.includes("<script>"));
  });
  it("backslash bilan escape qilingan belgilar", () => {
    const [b] = parseMarkdown("\\{ketdi\\} va \\*yulduz\\*");
    assert.ok(b.t === "p");
    assert.equal(textOf(b.c), "{ketdi} va *yulduz*");
  });
});

// ───────── Unicode

describe("parser: Unicode", () => {
  const cases: [string, string, string][] = [
    ["kirill", "Ёж — **ёлка**, ударе́ние", "Ёж — ёлка, ударе́ние"],
    ["yapon", "**て形**は「食べて」です。", "て形は「食べて」です。"],
    ["arab (RTL)", "مرحبا **بالعالم**", "مرحبا بالعالم"],
    ["emoji va surrogate", "👍🏽 **ok** 🙂", "👍🏽 ok 🙂"],
    ["birlashtiruvchi belgi", "é `á`", "é á"],
    ["zero-width", "a​**b**​c", "a​b​c"],
    ["o' apostroflar", "O‘zbek **o'quvchi** ʻok", "O‘zbek o'quvchi ʻok"],
  ];
  for (const [name, src, expected] of cases) {
    it(`${name}: matn saqlanadi`, () => {
      const [b] = parseMarkdown(src);
      assert.ok(b.t === "p");
      assert.equal(textOf(b.c), expected);
    });
  }
  it("lint Unicode lookalike'larni xom HTML deb hisoblamaydi, lekin real teglarni ushlaydi", () => {
    assert.deepEqual(lintMdxBody("＜script＞ va ‹b›"), []);
    assert.ok(lintMdxBody("<SCRIPT>").length > 0);
    assert.ok(lintMdxBody("<scr\nipt>").length > 0);
    assert.ok(lintMdxBody("<img src=x onerror=alert(1)>").length > 0);
    assert.ok(lintMdxBody("<a href=\"x\">x</a>").length > 0);
  });
  it("lint tone qiymatini va kichik harfli Callout'ni tekshiradi", () => {
    assert.ok(lintMdxBody('<Callout tone="evil">x</Callout>').length > 0);
    assert.ok(lintMdxBody("<callout>x</callout>").length > 0);
    assert.deepEqual(lintMdxBody("\\{escape\\} qilingan"), []);
  });
});

// ───────── uzun jadvallar (sxema + korpus)

describe("uzun jadvallar", () => {
  const languages = {
    schemaVersion: 1,
    explanationLanguages: ["uz"],
    languages: {
      en: { name: "English", nativeName: "English", enabled: true, dir: "ltr", levelSystem: "cefr", scripts: ["Latn"], blocks: ["table"], categories: [{ id: "tenses", title: { uz: "Zamonlar" } }] },
    },
  };
  const withTable = (rows: string[][], headers = ["A", "B", "C", "D", "E", "F", "G", "H"]): RawCorpus => ({
    languages: { path: "languages.json", text: JSON.stringify(languages) },
    redirects: { path: "redirects.json", text: JSON.stringify({ schemaVersion: 1, redirects: [], retired: [] }) },
    rules: [
      {
        meta: { path: "en/t/rule.json", text: JSON.stringify({ schemaVersion: 1, id: "gr_en_000001", lang: "en", slug: "t", category: "tenses", related: [] }) },
        translations: [
          {
            path: "en/t/uz.mdx",
            text: `---\n${JSON.stringify({
              ruleId: "gr_en_000001", explanationLang: "uz", status: "draft", revision: 1, title: "T", summary: "S",
              formulas: [], examples: [], exceptions: [], commonMistakes: [],
              blocks: [{ kind: "table", headers, rows }],
            })}\n---\n\nTana\n`,
          },
        ],
      },
    ],
  });
  const row = (n: number) => Array.from({ length: n }, (_, i) => "x".repeat(200).slice(0, 190) + i);

  it("60 qator × 8 ustun (200 belgigacha katak) qabul qilinadi", () => {
    const rows = Array.from({ length: 60 }, () => row(8));
    assert.deepEqual(parseCorpus(withTable(rows)).problems, []);
  });
  it("61 qator yoki 9 ustun rad etiladi", () => {
    assert.ok(parseCorpus(withTable(Array.from({ length: 61 }, () => row(8)))).problems.length > 0);
    assert.ok(parseCorpus(withTable([row(9)], ["1", "2", "3", "4", "5", "6", "7", "8", "9"])).problems.length > 0);
  });
  it("bo'sh katak va noto'g'ri ustun soni rad etiladi", () => {
    assert.ok(parseCorpus(withTable([["", "b"]], ["A", "B"])).problems.length > 0);
    assert.ok(parseCorpus(withTable([["a"]], ["A", "B"])).problems.length > 0);
  });
});

describe("parser cheklovlari (hujjatlashtirilgan)", () => {
  it("qo'llab-quvvatlanmaydigan sintaksis xato bermaydi, matn bo'lib chiqadi", () => {
    // ichma-ich ro'yxat, markdown jadval, blockquote, HTML entity, rasm: oddiy matn
    const src = "- a\n  - b\n\n| x | y |\n|---|---|\n\n> iqtibos\n\n&lt;b&gt;";
    assert.doesNotThrow(() => parseMarkdown(src));
    const blocks = parseMarkdown(src);
    assert.ok(blocks.every((b) => b.t === "p" || b.t === "ul"));
    assert.equal(parseInline("&lt;b&gt;")[0].t, "text");
  });
});
