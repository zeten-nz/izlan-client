import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyForm, fromContent, parseRuby, rubyToString, slugify, toContent } from "../../../features/grammar-admin/content-form.ts";

test("ruby: matn ↔ segmentlar", () => {
  assert.deepEqual(parseRuby("漢:かん 字:じ を"), [{ base: "漢", reading: "かん" }, { base: "字", reading: "じ" }, { base: "を" }]);
  assert.equal(rubyToString(parseRuby("漢:かん を")), "漢:かん を");
  assert.equal(parseRuby("  "), undefined);
});

test("forma → kontent → forma (aylanma) va bo'sh ixtiyoriy maydonlar tushiriladi", () => {
  const f = emptyForm("Articles");
  f.summary = "a/an/the";
  f.examples = [{ text: "I run", translation: "Men yuguraman", note: "", reading: "", stressed: "", ruby: "" }];
  f.sources = [{ title: "Qayd", url: "", author: "", license: "original", attribution: "", shareAlike: false, review: "", reviewNote: "" }];
  f.blocks = [{ kind: "table", caption: "", headers: "a | b", rows: "1 | 2\n3 | 4" }];
  const c = toContent(f) as Record<string, unknown>;
  assert.deepEqual((c.examples as unknown[])[0], { text: "I run", translation: "Men yuguraman" });
  assert.deepEqual((c.blocks as unknown[])[0], { kind: "table", headers: ["a", "b"], rows: [["1", "2"], ["3", "4"]] });
  assert.deepEqual((c.sources as Record<string, unknown>[])[0], { title: "Qayd", license: "original", shareAlike: false });
  const back = toContent(fromContent(c));
  assert.deepEqual(back, c);
});

test("jadval/tuslanish/kelishik bloklari aylanmasi", () => {
  const f = emptyForm("x");
  f.blocks = [
    { kind: "conjugation", caption: "c", forms: "I | am\nyou | are | ju" },
    { kind: "declension", caption: "", word: "стол", gender: "m", rows: "Именительный | nom | стол | столы" },
  ];
  const c = toContent(f);
  assert.deepEqual(toContent(fromContent(c)), c);
  const blocks = c.blocks as Record<string, unknown>[];
  assert.deepEqual(blocks[0].forms, [{ label: "I", value: "am" }, { label: "you", value: "are", reading: "ju" }]);
  assert.deepEqual(blocks[1].rows, [{ case: "Именительный", caseId: "nom", singular: "стол", plural: "столы" }]);
});

test("slugify", () => {
  assert.equal(slugify("Tarix Fani"), "tarix-fani");
  assert.equal(slugify("Articles: a, an, the"), "articles-a-an-the");
  assert.equal(slugify("O'zbek tili"), "ozbek-tili");
  assert.equal(slugify("  --x--  "), "x");
});
