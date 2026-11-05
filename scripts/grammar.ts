// Grammatika kontenti CLI (to'g'ridan-to'g'ri emas, `scripts/grammar.mjs` orqali ishga tushiriladi):
//   validate  — sxema + kross-tekshiruvlar + hosila fayllar (manifest, ommaviy ma'lumot) dolzarbligi; xatoda exit 1
//   sync      — manifest.json va src/generated/grammar-public.json ni qayta yaratadi
//   public    — faqat ommaviy ma'lumot va reyestrni yozadi (GRAMMAR_CONTENT_DIR bilan lokal sinov uchun)
//   export-registry [yo'l] — server repo'si uchun reyestr modulini yozadi (standart: ../server/src/grammar/grammar-registry.data.ts)
//   check-registry [yo'l]  — server reyestri versiyasi client bilan bir xilmi (deploy darvozasi)
//   compat [yo'l]          — yo'naltirilgan moslik: server approved qoidalari client'da ham approvedmi (release darvozasi)
//   hash <fayl.mdx>        — reviewer uchun: kontent xeshi (review.contentHash ga yoziladi)
//   report                 — har bir tarjima uchun tasdiqlash holati va yetishmayotgan bandlar
// Muhit o'zgaruvchilari (faqat lokal sinov): GRAMMAR_CONTENT_DIR, GRAMMAR_PUBLIC_OUT, GRAMMAR_REGISTRY_OUT.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseCorpus } from "../src/lib/grammar/corpus.ts";
import { readRawCorpus } from "../src/lib/grammar/fs-source.ts";
import { buildManifest, publicTranslations, serializeManifest } from "../src/lib/grammar/manifest.ts";
import { buildPublicData, serializePublicData } from "../src/lib/grammar/public-data.ts";
import { readiness } from "../src/lib/grammar/governance.ts";
import { parseFrontmatter } from "../src/lib/grammar/frontmatter.ts";
import { reviewContentHash } from "../src/lib/grammar/review.ts";
import { buildRegistry, compareRegistries, parseServerModule, serializeRegistry, serverModuleSource } from "../src/lib/grammar/registry.ts";

const root = resolve(process.env.GRAMMAR_CONTENT_DIR ?? join(process.cwd(), "content", "grammar"));
const manifestPath = join(root, "manifest.json");
const publicPath = resolve(process.env.GRAMMAR_PUBLIC_OUT ?? join(process.cwd(), "src", "generated", "grammar-public.json"));
const registryPath = resolve(process.env.GRAMMAR_REGISTRY_OUT ?? join(process.cwd(), "src", "generated", "grammar-registry.json"));
const DEFAULT_SERVER_MODULE = resolve(process.cwd(), "..", "server", "src", "grammar", "grammar-registry.data.ts");
const cmd = process.argv[2];
const argPath = process.argv[3] ? resolve(process.argv[3]) : DEFAULT_SERVER_MODULE;

const { corpus, problems } = parseCorpus(readRawCorpus(root));
const manifestText = serializeManifest(buildManifest(corpus));
const publicText = serializePublicData(buildPublicData(corpus));
const registry = buildRegistry(corpus);
const registryText = serializeRegistry(registry);

const read = (p: string) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};

function fail(list: { file: string; message: string }[]): never {
  for (const p of list) console.error(`✗ ${p.file}\n    ${p.message}`);
  console.error(`\n${list.length} ta muammo.`);
  process.exit(1);
}

if (cmd === "sync" || cmd === "public") {
  if (problems.length) fail(problems);
  if (cmd === "sync") writeFileSync(manifestPath, manifestText);
  writeFileSync(publicPath, publicText);
  writeFileSync(registryPath, registryText);
  console.log(
    `${cmd === "sync" ? "manifest.json, " : ""}grammar-public.json va grammar-registry.json yangilandi: ${corpus.rules.length} ta qoida, ommaviy: ${publicTranslations(corpus).length}, reyestr versiyasi: ${registry.version}.`,
  );
} else if (cmd === "validate") {
  if (problems.length) fail(problems);
  const stale: { file: string; message: string }[] = [];
  if (read(manifestPath) !== manifestText) stale.push({ file: manifestPath, message: "manifest eskirgan: `npm run grammar:sync`" });
  if (read(publicPath) !== publicText) stale.push({ file: publicPath, message: "ommaviy ma'lumot eskirgan: `npm run grammar:sync`" });
  if (read(registryPath) !== registryText) stale.push({ file: registryPath, message: "reyestr eskirgan: `npm run grammar:sync`" });
  if (stale.length) fail(stale);
  console.log(`OK: ${corpus.rules.length} ta qoida, ommaga chiqarilishi mumkin: ${publicTranslations(corpus).length}.`);
} else if (cmd === "compat") {
  if (problems.length) fail(problems);
  const text = read(argPath);
  const server = text ? parseServerModule(text) : null;
  if (!server) {
    console.error(`✗ Server reyestri o'qilmadi: ${argPath}`);
    process.exit(1);
  }
  const rep = compareRegistries(registry, server);
  console.log(`client: ${rep.clientVersion}, server: ${rep.serverVersion} (${rep.sameVersion ? "bir xil" : "FARQLI"})`);
  for (const w of rep.warnings) console.log(`  ⚠ ${w}`);
  for (const b of rep.blocking) console.error(`  ✗ ${b}`);
  if (rep.blocking.length) {
    console.error(`
TO'SQINLIK: ${rep.blocking.length} ta qoida. Avval client'ni deploy qiling (yoki serverni oldingi reyestrga qaytaring).`);
    process.exit(1);
  }
  console.log(rep.sameVersion ? "OK: reyestrlar bir xil." : "OK: yo'naltirilgan moslik bor (versiyalar farqli: deploy tugagach tenglashishi kerak).");
} else if (cmd === "hash") {
  const file = process.argv[3];
  if (!file) {
    console.error("Foydalanish: grammar.mjs hash <fayl.mdx>");
    process.exit(2);
  }
  const fm = parseFrontmatter(readFileSync(resolve(file), "utf8"));
  if (!fm.ok) {
    console.error(`✗ ${file}: ${fm.error}`);
    process.exit(1);
  }
  const data = fm.data as Record<string, unknown>;
  console.log(reviewContentHash(data, fm.body));
  console.error(`(revision: ${String(data.revision)}; bu qiymatni review.contentHash ga, revision'ni review.reviewedRevision ga yozing — faqat kontentni tekshirib bo'lgach)`);
} else if (cmd === "report") {
  const rows = corpus.rules.flatMap((r) => r.translations.map((t) => readiness(r, t, corpus.reviewers)));
  const reviewers = corpus.reviewers?.reviewers ?? [];
  console.log(`Tekshiruvchilar (reviewers.json): ${reviewers.length ? reviewers.map((x) => `${x.id} [${x.languages.join(",")}]`).join(", ") : "YO'Q (hech kim approved qila olmaydi)"}
`);
  for (const r of rows) {
    const line = `${r.id} ${r.lang}/${r.slug} (${r.explanationLang}) — ${r.status}, tahrir ${r.revision}, muallif: ${r.author ?? "—"}, reviewer: ${r.reviewedBy ?? "—"}`;
    console.log(line);
    if (r.status !== "approved" && r.blockers.length) for (const b of r.blockers) console.log(`    · ${b}`);
    if (r.status === "approved" && r.blockers.length) for (const b of r.blockers) console.log(`    ✗ ${b}`);
  }
  const counts = rows.reduce<Record<string, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {});
  console.log(`
Jami: ${rows.length} — ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ") || "yo'q"}`);
  if (problems.length) {
    console.log(`
Validatsiya muammolari: ${problems.length}`);
    for (const p of problems) console.log(`  ✗ ${p.file}: ${p.message}`);
    process.exit(1);
  }
} else if (cmd === "export-registry") {
  if (problems.length) fail(problems);
  writeFileSync(argPath, serverModuleSource(registry));
  console.log(`Server reyestri yozildi: ${argPath} (versiya ${registry.version}).`);
} else if (cmd === "check-registry") {
  if (problems.length) fail(problems);
  const expected = serverModuleSource(registry);
  if (read(argPath) !== expected) {
    console.error(
      `✗ Server reyestri client bilan mos emas (${argPath}).\n` +
        `    Client versiyasi: ${registry.version}. "npm run grammar:export-registry" ni ishga tushiring va server repo'sini commit qiling.`,
    );
    process.exit(1);
  }
  console.log(`OK: server reyestri client bilan bir xil (versiya ${registry.version}).`);
} else {
  console.error("Foydalanish: grammar.mjs validate | sync | public | export-registry [yo'l] | check-registry [yo'l] | compat [yo'l] | hash <fayl> | report");
  process.exit(2);
}
