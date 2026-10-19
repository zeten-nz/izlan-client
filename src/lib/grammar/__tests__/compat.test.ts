import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareRegistries, computeVersion, parseServerModule, serverModuleSource, type GrammarRegistry, type RegistryRule } from "../registry.ts";

const rule = (id: string, over: Partial<RegistryRule> = {}): RegistryRule => ({
  id, lang: "en", slug: id.slice(-6), category: "tenses", status: "approved", title: `T ${id}`, ...over,
});

function reg(over: Partial<Omit<GrammarRegistry, "version">> = {}): GrammarRegistry {
  const base = {
    schemaVersion: 1 as const,
    languages: [{ code: "en", name: "English", enabled: true }, { code: "ru", name: "Russian", enabled: false }],
    rules: [rule("gr_en_000001"), rule("gr_en_000002", { status: "review", title: null })],
    retired: [] as { id: string; replacedBy: string | null }[],
    ...over,
  };
  return { ...base, version: computeVersion(base) };
}

describe("client ↔ server moslik (yo'naltirilgan)", () => {
  it("bir xil reyestrlar: to'sqinlik ham, ogohlantirish ham yo'q", () => {
    const r = compareRegistries(reg(), reg());
    assert.equal(r.sameVersion, true);
    assert.deepEqual([r.blocking, r.warnings], [[], []]);
  });

  it("server approved qilgan qoida client'da yo'q → TO'SQINLIK (eski client + yangi server)", () => {
    const server = reg({ rules: [rule("gr_en_000001"), rule("gr_en_000009")] });
    const r = compareRegistries(reg(), server);
    assert.equal(r.blocking.length, 1);
    assert.match(r.blocking[0], /gr_en_000009.*client'da yo'q/);
  });

  it("server approved, client'da review (approved'dan qaytarilgan) → TO'SQINLIK", () => {
    const client = reg({ rules: [rule("gr_en_000001", { status: "review", title: null })] });
    const r = compareRegistries(client, reg());
    assert.equal(r.blocking.length, 1);
    assert.match(r.blocking[0], /'review'/);
  });

  it("client'da approved, serverda yo'q → faqat ogohlantirish (yangi client + eski server)", () => {
    const client = reg({ rules: [rule("gr_en_000001"), rule("gr_en_000003")] });
    const r = compareRegistries(client, reg());
    assert.equal(r.blocking.length, 0);
    assert.equal(r.warnings.length, 1);
    assert.equal(r.sameVersion, false);
  });

  it("client'da til yoqilmagan bo'lsa server approved qoidasi to'sqinlik", () => {
    const server = reg({ rules: [rule("gr_ru_000001", { lang: "ru" })] });
    const client = reg({ rules: [rule("gr_ru_000001", { lang: "ru" })] });
    const r = compareRegistries(client, server);
    assert.equal(r.blocking.length, 1);
    assert.match(r.blocking[0], /yoqilmagan/);
  });

  it("slug farqi ogohlantirish (ID bilan ishlaydi)", () => {
    const client = reg({ rules: [rule("gr_en_000001", { slug: "new-slug" })] });
    const r = compareRegistries(client, reg());
    assert.equal(r.blocking.length, 0);
    assert.ok(r.warnings.some((w) => /slug farqi/.test(w)));
  });

  it("server moduli generatsiyadan qayta o'qiladi; buzilgan fayl null", () => {
    const r = reg();
    assert.deepEqual(parseServerModule(serverModuleSource(r)), r);
    assert.equal(parseServerModule("export const x = 1;"), null);
    assert.equal(parseServerModule("GRAMMAR_REGISTRY_DATA: GrammarRegistryData = {oops};\n"), null);
  });
});
