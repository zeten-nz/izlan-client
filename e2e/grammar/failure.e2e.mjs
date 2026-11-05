// Kill-switch/uzilish holatlari: backend o'chsa kontent ≤30 s ochiq, keyin FAIL-CLOSED; qaytsa tiklanadi. Haqiqiy backend (g7).
import { chromium } from "playwright-core";
import { execFileSync, spawn } from "node:child_process";

const BASE = process.env.BASE ?? "http://localhost:3100";
const SERVER_DIR = process.env.SERVER_DIR ?? "../../../server";
const PASS = process.env.E2E_PASSWORD ?? "Grm-Test-2026!";
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n} ${x}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const login = async (u) => {
  const ctx = await browser.newContext({ baseURL: BASE });
  const r = await ctx.request.post("/api/auth/login", { data: { identifier: u, password: PASS, remember: false } });
  if (!r.ok()) throw new Error("login " + u);
  return ctx;
};
const api = async (ctx, m, p, d) => { const r = await ctx.request.fetch("/api" + p, { method: m, data: d }); let b = null; try { b = await r.json(); } catch {} return { status: r.status(), body: b }; };
const cli = (...a) => execFileSync("node", ["dist/grammar/cli.js", ...a], { cwd: SERVER_DIR, env: process.env, encoding: "utf8" });
const GOOD = { title: "Fail Test", summary: "x", examples: [{ text: "I run.", translation: "a" }, { text: "You run.", translation: "b" }], sources: [{ title: "q", license: "original" }], body: "Matn.\n" };

const admin = await login("admin1");
const student = await login("student1");
const r = (await api(admin, "POST", "/staff/grammar/manage/rules", { lang: "en", slug: "fail-test", category: "articles", content: GOOD })).body;
await api(admin, "POST", `/staff/grammar/manage/revisions/${r.revisionId}/submit`);
const rv = (await api(admin, "GET", `/staff/grammar/manage/rules/${r.ruleId}`)).body.revisions[0];
await api(admin, "POST", `/admin/grammar/revisions/${rv.id}/approve`, { contentHash: rv.contentHash });
const cand = (await api(admin, "POST", "/admin/grammar/releases/candidate", {})).body;
cli("activate", "--release", cand.releaseId, "--expect-hash", cand.snapshotHash, "--actor", "e2e", "--reason", "fail test", "--backup-at", new Date().toISOString());
await sleep(4500);

const page = await student.newPage();
const state = async () => {
  const resp = await page.goto(BASE + "/grammar/en/fail-test", { waitUntil: "networkidle" });
  const open = await page.locator("h1:visible", { hasText: "Fail Test" }).count();
  const closed = await page.getByText("Grammatika hozircha mavjud emas").count();
  return { status: resp.status(), open: open > 0, closed: closed > 0 };
};
ok("boshlang'ich: kontent ochiq", (await state()).open);

// backend'ni o'chiramiz
const pid = execFileSync("powershell", ["-NoProfile", "-Command", "(Get-NetTCPConnection -LocalPort 4001 -State Listen).OwningProcess"], { encoding: "utf8" }).trim();
execFileSync("taskkill", ["/PID", pid, "/F", "/T"], { stdio: "ignore" });
const t0 = Date.now();
await sleep(5000);
const s5 = await state();
ok(`backend o'chdi (+${Math.round((Date.now() - t0) / 1000)}s): kontent ko'rinmaydi (auth ham backendga tayanadi → /login)`, !s5.open, JSON.stringify(s5) + page.url());
await sleep(Math.max(0, 34000 - (Date.now() - t0)));
const s34 = await state();
ok(`+${Math.round((Date.now() - t0) / 1000)}s: kontent hamon yopiq (fail-closed)`, !s34.open, JSON.stringify(s34));

// qayta ishga tushirish
const srv = spawn("node", ["dist/main.js"], { cwd: SERVER_DIR, env: { ...process.env, PORT: "4001", GRAMMAR_SOURCE: "release", GRAMMAR_INTERNAL_TOKEN: "e2e-grammar-token-0123456789abcdef" }, stdio: "ignore", detached: true });
srv.unref();
const t1 = Date.now();
let recovered = false;
for (let i = 0; i < 20 && !recovered; i++) { await sleep(2000); recovered = (await state()).open; }
ok(`backend qaytdi: tiklandi (${Math.round((Date.now() - t1) / 1000)}s)`, recovered);

console.log(`\nJAMI: ${pass} PASS, ${fail} FAIL`);
await browser.close();
process.exit(fail ? 1 : 0);
