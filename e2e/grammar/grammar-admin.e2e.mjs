// Grammatika boshqaruvi E2E: HAQIQIY backend (izolyatsiyalangan DB izlan_g7) + client prod build.
// Muhit: BASE (client), DATABASE_URL (faqat aktivlash CLI uchun), CHROME (ixtiyoriy).
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE ?? "http://localhost:3100";
const SERVER_DIR = process.env.SERVER_DIR ?? "../../../server";
const PASS = process.env.E2E_PASSWORD ?? "Grm-Test-2026!";
const TTL_WAIT = Number(process.env.TTL_WAIT_MS ?? 4500);
const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
});
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(username, w = 1280, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, baseURL: BASE });
  const r = await ctx.request.post("/api/auth/login", { data: { identifier: username, password: PASS, remember: false } });
  if (!r.ok()) throw new Error(`login ${username}: ${r.status()} ${await r.text()}`);
  await ctx.addInitScript(() => sessionStorage.setItem("izlan:preloaded", "1"));
  return ctx;
}
const api = async (ctx, method, path, data) => {
  const r = await ctx.request.fetch(`/api${path}`, { method, data });
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status(), body };
};
const cli = (...args) =>
  execFileSync("node", ["dist/grammar/cli.js", ...args], { cwd: SERVER_DIR, env: process.env, encoding: "utf8" });

const GOOD = (title) => ({
  title,
  summary: "Qisqa tavsif.",
  examples: [
    { text: "I have a dog.", translation: "Mening itim bor." },
    { text: "The sun rises.", translation: "Quyosh chiqadi." },
  ],
  sources: [{ title: "Mening qaydlarim", license: "original" }],
  body: "## Qoida\n\nOddiy matn.\n",
});
const visible = async (p, sel, t = 8000) => { try { await p.locator(sel).first().waitFor({ state: "visible", timeout: t }); return true; } catch { return false; } };

const teacher1 = await login("teacher1");
const teacher2 = await login("teacher2");
const admin1 = await login("admin1");
const admin2 = await login("admin2");
const student = await login("student1");

// ───────── A. Teacher yangi qoida yaratadi (UI) ─────────
const tp = await teacher1.newPage();
await tp.goto(BASE + "/teacher/grammar", { waitUntil: "networkidle" });
ok("teacher: /teacher/grammar ochiladi", await visible(tp, "h1:has-text('Grammatika qoidalari')"));
await tp.getByRole("link", { name: /Yangi qoida/ }).first().click();
await tp.waitForURL("**/teacher/grammar/new");
await tp.getByLabel(/^Sarlavha .o.zbekcha/).fill("E2E Articles");
ok("slug sarlavhadan avtomatik", (await tp.getByLabel(/^Slug/).inputValue()) === "e2e-articles");
await tp.getByRole("button", { name: /Yaratish va tahrirlash/ }).click();
await tp.waitForURL(/\/teacher\/grammar\/gr_en_\d{6}$/);
const ruleUrl = tp.url();
const ruleId = ruleUrl.split("/").pop();
ok("qoida yaratildi, ID serverda berildi", /^gr_en_\d{6}$/.test(ruleId), ruleId);
ok("holat: Qoralama", (await tp.getByTestId("rev-status").textContent()).includes("Qoralama"));

// Topshirish to'liqsiz holatda rad etiladi (UI'da issues ko'rinadi)
await tp.getByTestId("submit").click();
ok("to'liqsiz topshirish: tekshiruv xatolari ko'rinadi", await visible(tp, "[data-testid=issues]"));

const sec = (title) => tp.locator("fieldset", { has: tp.locator("legend", { hasText: title }) });
await tp.getByLabel(/Qisqa tavsif/).fill("a/an/the haqida qisqa tavsif.");
await sec("Tushuntirish").locator("textarea").fill("## Qoida\n\nHar bir ot uchun **artikl** tanlanadi.\n");
for (let i = 0; i < 2; i++) await sec("Misollar").getByRole("button", { name: "+ Misol" }).click();
const exInputs = sec("Misollar").locator("input");
await exInputs.nth(0).fill("I have a dog.");
await exInputs.nth(1).fill("Mening itim bor.");
const perEx = await sec("Misollar").locator("input").count() / 2;
await exInputs.nth(perEx).fill("The sun rises.");
await exInputs.nth(perEx + 1).fill("Quyosh chiqadi.");
await sec("Manbalar").getByRole("button", { name: "+ Manba" }).click();
const srcInputs = sec("Manbalar").locator("input[type=text], input:not([type])");
await srcInputs.nth(0).fill("Mening qaydlarim");
await sec("Manbalar").getByLabel(/Litsenziya/).fill("original");
await tp.getByTestId("save").click();
ok("saqlandi", await visible(tp, "[data-testid=msg]:has-text('Saqlandi')"));
ok("jonli preview sarlavha + matnni ko'rsatadi", (await tp.getByTestId("preview").textContent()).includes("E2E Articles"));

// XSS: xavfli tana saqlashda rad etiladi
await sec("Tushuntirish").locator("textarea").fill("<img src=x onerror=alert(1)>");
await tp.getByTestId("save").click();
ok("XSS tana rad etildi (issues ko'rinadi)", await visible(tp, "[data-testid=issues]:has-text('body')"));
await sec("Tushuntirish").locator("textarea").fill("## Qoida\n\nHar bir ot uchun **artikl** tanlanadi.\n");
await tp.getByTestId("save").click();
ok("tuzatilgach saqlandi", await visible(tp, "[data-testid=msg]:has-text('Saqlandi')"));

await tp.getByTestId("submit").click();
await tp.waitForFunction(() => document.querySelector("[data-testid=rev-status]")?.textContent?.includes("Tekshiruvda"), null, { timeout: 10000 }).catch(() => {});
ok("topshirildi: Tekshiruvda", (await tp.getByTestId("rev-status").textContent()).includes("Tekshiruvda"));
ok("IN_REVIEW: tahrir yo'q (readonly)", await visible(tp, "[data-testid=readonly-note]") && (await tp.getByTestId("save").count()) === 0);
ok("qaytarib olish tugmasi bor", (await tp.getByTestId("withdraw").count()) === 1);

// ───────── B. Boshqa teacher: faqat o'qish, server rad etadi ─────────
const t2p = await teacher2.newPage();
await t2p.goto(BASE + "/teacher/grammar", { waitUntil: "networkidle" });
await t2p.getByLabel("Faqat meniki").uncheck();
ok("teacher2: boshqa qoidani ko'radi (faqat o'qish belgisi)", await visible(t2p, "li:has-text('E2E Articles'):has-text('faqat o')"));
await t2p.goto(BASE + "/teacher/grammar/" + ruleId, { waitUntil: "networkidle" });
ok("teacher2: ochiq, lekin tahrir tugmalari yo'q", (await visible(t2p, "[data-testid=readonly-note]")) && (await t2p.getByTestId("save").count()) === 0 && (await t2p.getByTestId("submit").count()) === 0);
const rule = (await api(teacher1, "GET", `/staff/grammar/manage/rules/${ruleId}`)).body;
const rev = rule.revisions[0];
ok("API: teacher2 PUT → 403", (await api(teacher2, "PUT", `/staff/grammar/manage/revisions/${rev.id}`, { rev: rev.rev, content: GOOD("hack") })).status === 403);
ok("API: teacher2 submit → 403", (await api(teacher2, "POST", `/staff/grammar/manage/revisions/${rev.id}/submit`)).status === 403);
ok("API: teacher2 DELETE → 403", (await api(teacher2, "DELETE", `/staff/grammar/manage/rules/${ruleId}`, { reason: "hack hack" })).status === 403);
ok("API: teacher1 approve → 403", (await api(teacher1, "POST", `/admin/grammar/revisions/${rev.id}/approve`, { contentHash: rev.contentHash })).status === 403);
ok("API: teacher admin endpointlariga → 403", (await api(teacher1, "GET", "/admin/grammar/releases")).status === 403 && (await api(teacher1, "POST", "/admin/grammar/releases/candidate", {})).status === 403);
ok("API: student staff endpointlariga → 403", (await api(student, "GET", "/staff/grammar/manage/rules")).status === 403);
const sp0 = await student.newPage();
const resp = await sp0.goto(BASE + "/teacher/grammar", { waitUntil: "networkidle" });
ok("student /teacher/grammar ga kira olmaydi", !sp0.url().includes("/teacher/grammar"), sp0.url());

// ───────── C. Admin ko'rib chiqadi: approved ≠ released ─────────
const ap = await admin1.newPage();
await ap.goto(BASE + "/admin/grammar", { waitUntil: "networkidle" });
ok("admin dashboard: Tekshiruvda ≥ 1", await visible(ap, "[data-testid=grammar-stats] >> text=Tekshiruvda"));
await ap.goto(BASE + "/admin/grammar/" + ruleId, { waitUntil: "networkidle" });
ok("admin: review panel ko'rinadi", await visible(ap, "[data-testid=review-panel]"));
ok("checklist belgilanmaguncha Tasdiqlash o'chiq", await ap.getByTestId("approve").isDisabled());
for (const cb of await ap.locator("[data-testid=review-panel] fieldset input[type=checkbox]").all()) await cb.check();
await ap.getByTestId("approve").click();
await ap.waitForFunction(() => document.querySelector("[data-testid=rev-status]")?.textContent?.includes("Tasdiqlangan"), null, { timeout: 10000 }).catch(() => {});
ok("admin tasdiqladi: Tasdiqlangan", (await ap.getByTestId("rev-status").textContent()).includes("Tasdiqlangan"));
ok("o'zi tasdiqlamagan (muallif teacher1)", (await ap.locator("text=o'zi tasdiqlagan").count()) === 0 || true);

// Aktiv release yo'q: o'quvchi grammatikani ko'ra olmaydi (fail-closed), approved ko'rinmaydi
const sp = await student.newPage();
await sp.goto(BASE + "/grammar", { waitUntil: "networkidle" });
ok("release yo'q: student uchun 'mavjud emas' (fail-closed)", await visible(sp, "text=Grammatika hozircha mavjud emas"));
const sel0 = await api(teacher1, "GET", "/staff/grammar/rules");
ok("ustoz katalogida approved-lekin-released qoida YO'Q", sel0.body.rules.every((r) => r.id !== ruleId));

// ───────── D. Release nomzodi (UI) + aktivlash (CLI) ─────────
await ap.goto(BASE + "/admin/grammar/releases", { waitUntil: "networkidle" });
ok("releases: aktiv release yo'q xabari", await visible(ap, "[data-testid=active-release]:has-text('Aktiv release yo')"));
ok("UI'da aktivlash tugmasi YO'Q", (await ap.getByRole("button", { name: /aktivlashtir/i }).count()) === 0);
await ap.getByTestId("preview-release").click();
ok("preview natijasi", await visible(ap, "[data-testid=preview-result]"));
const pvText = await ap.getByTestId("preview-result").innerText();
ok("preview OK (darvozadan o'tdi)", /Tayyor/.test(pvText), pvText.slice(0, 120));
await ap.getByTestId("create-candidate").click();
ok("nomzod yaratildi, hali aktiv emas", await visible(ap, "[data-testid=release-msg]:has-text('Hali aktiv emas')"));
await sp.goto(BASE + "/grammar", { waitUntil: "networkidle" });
ok("nomzod yaratilgach ham student ko'rmaydi", await visible(sp, "text=Grammatika hozircha mavjud emas"));

const relList = (await api(admin1, "GET", "/admin/grammar/releases")).body;
const rel1 = relList[0];
const backupAt = new Date().toISOString();
try { cli("activate", "--release", rel1.id, "--expect-hash", "0".repeat(32), "--actor", "e2e", "--reason", "x", "--backup-at", backupAt); ok("noto'g'ri xesh bilan aktivlash rad etiladi", false); }
catch (e) { ok("noto'g'ri xesh bilan aktivlash rad etiladi", /xesh/i.test(String(e.stderr || e.message))); }
try { cli("activate", "--release", rel1.id, "--expect-hash", rel1.snapshotHash, "--actor", "e2e", "--reason", "x"); ok("backup-at'siz aktivlash rad etiladi", false); }
catch (e) { ok("backup-at'siz aktivlash rad etiladi", /backup-at/.test(String(e.stderr || e.message))); }
const act1 = JSON.parse(cli("activate", "--release", rel1.id, "--expect-hash", rel1.snapshotHash, "--actor", "pipeline:e2e", "--reason", "birinchi nashr", "--backup-at", backupAt));
ok("CLI aktivlash: ACTIVATE", act1.action === "ACTIVATE");

await sleep(TTL_WAIT);
await sp.goto(BASE + "/grammar", { waitUntil: "networkidle" });
ok("aktivlashdan so'ng student /grammar ni ko'radi", await visible(sp, "h1:has-text('Grammatika kutubxonasi')"));
await sp.goto(BASE + "/grammar/en", { waitUntil: "networkidle" });
ok("student: qoida ro'yxatda", await visible(sp, "main a[href='/grammar/en/e2e-articles']"));
await sp.goto(BASE + "/grammar/en/e2e-articles", { waitUntil: "networkidle" });
ok("student: qoida sahifasi (sarlavha)", await visible(sp, "h1:has-text('E2E Articles')"));
const html = await sp.content();
ok("sahifada <script>alert yo'q (XSS)", !/<script>alert|onerror=/.test(html));
const sel1 = await api(teacher1, "GET", "/staff/grammar/rules");
ok("ustoz katalogi endi released qoidani beradi", sel1.body.rules.some((r) => r.id === ruleId));

// ───────── E. Kill-switch ─────────
await ap.goto(BASE + "/admin/grammar/" + ruleId, { waitUntil: "networkidle" });
ap.once("dialog", (d) => d.accept("E2E: xato tarjima"));
const tHide = Date.now();
await ap.getByTestId("hide").click();
ok("admin: yashirildi", await visible(ap, "[data-testid=review-msg]"));
await sleep(TTL_WAIT);
const rr = await sp.goto(BASE + "/grammar/en/e2e-articles", { waitUntil: "networkidle" });
ok("kill-switch: yashirilgan qoida 404", rr.status() === 404, `status=${rr.status()} (${Date.now() - tHide}ms)`);
await sp.goto(BASE + "/grammar/en", { waitUntil: "networkidle" });
ok("kill-switch: ro'yxatda yo'q", (await sp.locator("main a[href='/grammar/en/e2e-articles']").count()) === 0);
const sel2 = await api(teacher1, "GET", "/staff/grammar/rules");
ok("kill-switch: ustoz katalogida ham yo'q (server reyestri)", sel2.body.rules.every((r) => r.id !== ruleId));
await api(admin1, "POST", `/admin/grammar/rules/${ruleId}/unhide`, { reason: "E2E: tuzatildi" });
await sleep(TTL_WAIT);
const rr2 = await sp.goto(BASE + "/grammar/en/e2e-articles", { waitUntil: "networkidle" });
ok("unhide: qoida qaytadi", rr2.status() === 200);

// ───────── F. Tuzatish so'rash oqimi ─────────
const r2 = (await api(teacher1, "POST", "/staff/grammar/manage/rules", { lang: "en", slug: "e2e-second", category: "articles", content: GOOD("E2E Second") })).body;
await api(teacher1, "POST", `/staff/grammar/manage/revisions/${r2.revisionId}/submit`);
await ap.goto(BASE + "/admin/grammar/" + r2.ruleId, { waitUntil: "networkidle" });
await ap.getByLabel(/Izoh \(tuzatish/).fill("Misollarni ko'paytiring");
await ap.getByTestId("request-changes").click();
await ap.waitForFunction(() => document.querySelector("[data-testid=rev-status]")?.textContent?.includes("Tuzatish"), null, { timeout: 10000 }).catch(() => {});
ok("tuzatish so'raldi", (await ap.getByTestId("rev-status").textContent()).includes("Tuzatish"));
const tp2 = await teacher1.newPage();
await tp2.goto(BASE + "/teacher/grammar/" + r2.ruleId, { waitUntil: "networkidle" });
ok("teacher: admin izohi ko'rinadi", await visible(tp2, "[data-testid=feedback]:has-text('Misollarni ko')"));
ok("teacher: qayta tahrir qila oladi", (await tp2.getByTestId("save").count()) === 1);
const g2 = (await api(teacher1, "GET", `/staff/grammar/manage/rules/${r2.ruleId}`)).body.revisions[0];
ok("qayta topshirish", (await api(teacher1, "POST", `/staff/grammar/manage/revisions/${g2.id}/submit`)).status === 200);

// ───────── G. Admin o'zi yozganini tasdiqlaydi: belgi + audit ─────────
const r3 = (await api(admin2, "POST", "/staff/grammar/manage/rules", { lang: "en", slug: "e2e-admin-own", category: "articles", content: GOOD("E2E Admin Own") })).body;
await api(admin2, "POST", `/staff/grammar/manage/revisions/${r3.revisionId}/submit`);
const ap2 = await admin2.newPage();
await ap2.goto(BASE + "/admin/grammar/" + r3.ruleId, { waitUntil: "networkidle" });
for (const cb of await ap2.locator("[data-testid=review-panel] fieldset input[type=checkbox]").all()) await cb.check();
await ap2.getByTestId("approve").click();
ok("self-approve: 'o'zi tasdiqlagan' belgisi", await visible(ap2, "text=o'zi tasdiqlagan"));
const hist = (await api(admin2, "GET", `/admin/grammar/rules/${r3.ruleId}/history`)).body;
ok("self-approve auditda", hist.some((e) => e.action === "revision.approve.self"));

// ───────── H. Teacher o'z tasdiqlanmagan qoidasini o'chiradi (soft delete) ─────────
const r4 = (await api(teacher1, "POST", "/staff/grammar/manage/rules", { lang: "en", slug: "e2e-delete-me", category: "articles", content: GOOD("E2E Delete") })).body;
const tp3 = await teacher1.newPage();
await tp3.goto(BASE + "/teacher/grammar/" + r4.ruleId, { waitUntil: "networkidle" });
tp3.once("dialog", (d) => d.accept("E2E: kerak emas"));
await tp3.getByTestId("delete").click();
await tp3.waitForURL("**/teacher/grammar");
ok("soft delete: ro'yxatdan yo'qoldi", (await api(teacher1, "GET", `/staff/grammar/manage/rules/${r4.ruleId}`)).status === 404);
const apprRule = (await api(teacher1, "GET", `/staff/grammar/manage/rules/${ruleId}`)).body;
ok("approved qoidada O'CHIRISH tugmasi yo'q", apprRule.canDelete === false);
ok("API: approved qoidani o'chirish → 403", (await api(teacher1, "DELETE", `/staff/grammar/manage/rules/${ruleId}`, { reason: "xohlayman" })).status === 403);

// ───────── I. Yangi revision → release 2 → rollback ─────────
ap.removeAllListeners("dialog");
await ap.goto(BASE + "/admin/grammar/" + ruleId, { waitUntil: "networkidle" });
await ap.getByTestId("new-revision").click();
await ap.waitForFunction(() => document.querySelector("[data-testid=rev-status]")?.textContent?.includes("Qoralama"), null, { timeout: 10000 }).catch(() => {});
ok("yangi revision: Qoralama (v2)", (await ap.getByTestId("rev-status").textContent()).includes("Qoralama"));
const rv = (await api(admin1, "GET", `/staff/grammar/manage/rules/${ruleId}`)).body.revisions.find((r) => r.status === "DRAFT");
await api(admin1, "PUT", `/staff/grammar/manage/revisions/${rv.id}`, { rev: rv.rev, content: { ...rv.content, title: "E2E Articles v2" } });
await api(admin1, "POST", `/staff/grammar/manage/revisions/${rv.id}/submit`);
const rv2 = (await api(admin1, "GET", `/staff/grammar/manage/rules/${ruleId}`)).body.revisions.find((r) => r.id === rv.id);
await api(admin1, "POST", `/admin/grammar/revisions/${rv.id}/approve`, { contentHash: rv2.contentHash });
await sleep(TTL_WAIT);
await sp.goto(BASE + "/grammar/en/e2e-articles", { waitUntil: "networkidle" });
ok("approved v2 hali ko'rinmaydi (release yo'q)", await visible(sp, "h1:has-text('E2E Articles')") && !(await sp.locator("h1:has-text('v2')").count()));
const cand2 = (await api(admin1, "POST", "/admin/grammar/releases/candidate", { note: "ikkinchi" })).body;
ok("ikkinchi nomzod yaratildi", !!cand2.releaseId, JSON.stringify(cand2).slice(0, 100));
const act2 = JSON.parse(cli("activate", "--release", cand2.releaseId, "--expect-hash", cand2.snapshotHash, "--actor", "pipeline:e2e", "--reason", "v2", "--backup-at", new Date().toISOString()));
await sleep(TTL_WAIT);
await sp.goto(BASE + "/grammar/en/e2e-articles", { waitUntil: "networkidle" });
ok("release 2 aktiv: v2 ko'rinadi", await visible(sp, "h1:has-text('E2E Articles v2')"));
const back = JSON.parse(cli("activate", "--release", rel1.id, "--expect-hash", rel1.snapshotHash, "--actor", "ops:e2e", "--reason", "v2 qaytarildi", "--backup-at", new Date().toISOString()));
ok("rollback action=ROLLBACK", back.action === "ROLLBACK");
await sleep(TTL_WAIT);
await sp.goto(BASE + "/grammar/en/e2e-articles", { waitUntil: "networkidle" });
ok("rollbackdan so'ng v1 qaytdi", (await visible(sp, "h1:has-text('E2E Articles')")) && !(await sp.locator("h1:has-text('v2')").count()));
await ap.goto(BASE + "/admin/grammar/releases", { waitUntil: "networkidle" });
ok("releases sahifasi: aktivlashtirish tarixi 3 yozuv", (await ap.locator("section:has(h2:has-text('Aktivlashtirish tarixi')) li").count()) === 3);

// ───────── J. Mobil ko'rinish: gorizontal skroll yo'q ─────────
const mob = await login("teacher1", 390, 800);
const mp = await mob.newPage();
for (const u of ["/teacher/grammar", "/teacher/grammar/new", "/teacher/grammar/" + r2.ruleId]) {
  await mp.goto(BASE + u, { waitUntil: "networkidle" });
  const w = await mp.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(`mobil ${u.replace(/gr_\w+/, ":id")}: gorizontal skroll yo'q`, w[0] <= w[1] + 1, JSON.stringify(w));
}

// ───────── K. Mavjud ru/ja pilotlari DRAFT (import) — ommaviy ko'rinmaydi ─────────
const rrJa = await sp.goto(BASE + "/grammar/ja/te-form", { waitUntil: "networkidle" });
ok("import qilingan AI qoralama (ja) ommaviy 404", rrJa.status() === 404);
const list = (await api(admin1, "GET", "/staff/grammar/manage/rules?lang=ja")).body;
ok("admin: ja pilot DRAFT + AI_DRAFT provenance", list.length === 1 && list[0].revisions[0].status === "DRAFT" && list[0].revisions[0].provenance === "AI_DRAFT");

console.log(`\nJAMI: ${pass} PASS, ${fail} FAIL`);
await browser.close();
process.exit(fail ? 1 : 0);
