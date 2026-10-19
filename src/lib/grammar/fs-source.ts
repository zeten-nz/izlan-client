// Faqat server/skript tomonida: kontent papkasini o'qiydi. Client komponentlardan import qilmang.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { RawCorpus, RawFile } from "./corpus.ts";
import { LANG_RE } from "./ids.ts";

const read = (path: string): RawFile => ({ path, text: readFileSync(path, "utf8") });
const dirs = (p: string) => readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory());

export function readRawCorpus(root: string): RawCorpus {
  const rules: RawCorpus["rules"] = [];
  for (const lang of dirs(root).filter((d) => LANG_RE.test(d)).sort()) {
    for (const dir of dirs(join(root, lang)).sort()) {
      const base = join(root, lang, dir);
      const metaPath = join(base, "rule.json");
      if (!existsSync(metaPath)) {
        rules.push({ meta: { path: metaPath, text: "" }, translations: [] });
        continue;
      }
      const translations = readdirSync(base)
        .filter((f) => f.endsWith(".mdx"))
        .sort()
        .map((f) => read(join(base, f)));
      rules.push({ meta: read(metaPath), translations });
    }
  }
  const manifestPath = join(root, "manifest.json");
  const reviewersPath = join(root, "reviewers.json");
  return {
    languages: read(join(root, "languages.json")),
    redirects: read(join(root, "redirects.json")),
    rules,
    committedManifest: existsSync(manifestPath) ? read(manifestPath) : undefined,
    reviewers: existsSync(reviewersPath) ? read(reviewersPath) : undefined,
  };
}
