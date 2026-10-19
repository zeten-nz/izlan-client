// Fixture generatori (faqat test): approved fixture fayllariga governance maydonlarini (muallif, manba, review, xesh) yozadi.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/grammar/__fixtures__/build.ts
// DIQQAT: bu fixture'lar sinov uchun; "fixture-reviewer" haqiqiy shaxs emas va production kontentga kirmaydi.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "../frontmatter.ts";
import { reviewContentHash } from "../review.ts";

const root = join(process.cwd(), "src", "lib", "grammar", "__fixtures__", "content");

writeFileSync(
  join(root, "reviewers.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      reviewers: [
        { id: "fixture-reviewer", name: "Fixture Reviewer (sinov)", role: "methodist", languages: ["en", "ru", "ja"], addedAt: "2026-01-01", appointedBy: "fixture (haqiqiy emas)" },
      ],
    },
    null,
    2,
  ) + "\n",
);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
  });
}

let n = 0;
for (const file of walk(root)) {
  const fm = parseFrontmatter(readFileSync(file, "utf8"));
  if (!fm.ok) throw new Error(`${file}: ${fm.error}`);
  const data = fm.data as Record<string, unknown>;
  if (data.status !== "approved") continue;
  const body = fm.body;
  const base: Record<string, unknown> = { ...data, author: "fixture-author", sources: [{ title: "Fixture manba (haqiqiy emas)", license: "original" }] };
  delete base.review;
  base.review = {
    reviewedBy: "fixture-reviewer",
    reviewedAt: "2026-01-03",
    reviewedRevision: base.revision,
    contentHash: reviewContentHash(base, body),
    checks: { grammar: true, examples: true, translations: true, level: true },
  };
  writeFileSync(file, `---\n${JSON.stringify(base, null, 2)}\n---\n${body}`);
  n++;
}
console.log(`${n} ta approved fixture yangilandi`);
