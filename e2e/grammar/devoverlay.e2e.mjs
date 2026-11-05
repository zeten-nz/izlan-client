import { chromium } from "playwright-core";
const BASE = process.env.BASE ?? "http://localhost:3101";
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n} ${x}`); };
const login = async (u) => {
  const ctx = await browser.newContext({ baseURL: BASE });
  const r = await ctx.request.post("/api/auth/login", { data: { identifier: u, password: process.env.E2E_PASSWORD ?? "Grm-Test-2026!", remember: false } });
  if (!r.ok()) throw new Error("login " + u + r.status());
  return ctx;
};
const check = async (ctx, url, label) => {
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 200)));
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 200)));
  const r = await p.goto(BASE + url, { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(1500);
  const overlay = await p.evaluate(() => {
    const sr = document.querySelector("nextjs-portal")?.shadowRoot;
    if (!sr) return "";
    const dlg = sr.querySelector("[data-nextjs-dialog], [data-nextjs-error-overlay], [role=dialog], dialog");
    const issues = sr.querySelector("[data-issues-open], [data-nextjs-dev-tools-button][data-nextjs-dev-tools-issues]");
    return dlg ? "DIALOG:" + (dlg.textContent || "").slice(0, 300) : issues ? "ISSUES" : "";
  });
  ok(`${label} (${url.replace(/gr_\w+/, ":id")}) status ${r.status()}, overlay/console temiz`, r.status() < 400 && !overlay && errs.length === 0, overlay || errs.join(" | "));
  await p.close();
};
const t = await login("teacher1"), a = await login("admin1"), s = await login("student1");
const rules = (await (await a.request.get("/api/staff/grammar/manage/rules")).json());
const id = rules[0].id, slug = rules[0].slug;
for (const u of ["/teacher/grammar", "/teacher/grammar/new", "/teacher/grammar/" + id]) await check(t, u, "teacher");
for (const u of ["/admin/grammar", "/admin/grammar/new", "/admin/grammar/releases", "/admin/grammar/" + id]) await check(a, u, "admin");
for (const u of ["/grammar", "/grammar/en", "/grammar/en/" + slug]) await check(s, u, "student");
console.log(`\nJAMI: ${pass} PASS, ${fail} FAIL`);
await browser.close();
process.exit(fail ? 1 : 0);
