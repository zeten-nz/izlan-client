// O'quvchi oqimi smoke testi (HTTP darajasida, ishlab turgan client + server'ga qarshi).
// Tekshiradi: health, xavfsizlik sarlavhalari (majburiy CSP), ichki API yopiqligi, cookie'siz 307, login,
// asosiy sahifalar, yo'nalish tanlash → "0 dan", pullik mavzular belgisi, balans/kurslar, media paywall, logout,
// ro'yxatdan o'tishning brauzerga bog'liqligi (S-01).
// Vaqtinchalik foydalanuvchi bazada yaratiladi va oxirida o'chiriladi (email yuborilmaydi).
//
// Ishga tushirish (client/ ichida, dev serverlar ishlab turganda):
//   node e2e/smoke/student-smoke.e2e.mjs
// O'zgaruvchilar: BASE (standart http://localhost:3000), SERVER_DIR (standart ../server; dist/ build qilingan bo'lishi kerak).
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SERVER_DIR = path.resolve(process.env.SERVER_DIR ?? "../server");
const require = createRequire(path.join(SERVER_DIR, "package.json"));
const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require(path.join(SERVER_DIR, "dist/auth/crypto.util.js"));
const prisma = new PrismaClient();

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  — ${extra}` : ""}`); };

const tag = `smk${Date.now().toString(36)}`;
const PASS = `Sm${randomBytes(9).toString("base64url")}9a`;
let userId = null;

async function main() {
  // ── ommaviy qism
  const health = await fetch(`${BASE}/api/health`);
  ok("health 200", health.status === 200);

  const home = await fetch(`${BASE}/`);
  const csp = home.headers.get("content-security-policy") ?? "";
  ok("bosh sahifa 200", home.status === 200);
  ok("CSP majburiy: default-src 'self'", csp.includes("default-src 'self'"));
  ok("CSP: frame-ancestors 'none'", csp.includes("frame-ancestors 'none'"));
  ok("Report-Only yo'q", !home.headers.get("content-security-policy-report-only"));
  ok("X-Frame-Options DENY", home.headers.get("x-frame-options") === "DENY");
  ok("X-Powered-By yo'q", !home.headers.get("x-powered-by"));

  ok("/api/internal brauzerdan 404", (await fetch(`${BASE}/api/internal/incomes/stats`)).status === 404);
  const noCookie = await fetch(`${BASE}/student`, { redirect: "manual" });
  ok("cookie'siz /student → 307 /login", noCookie.status === 307 && (noCookie.headers.get("location") ?? "").includes("/login"));

  const prices = await (await fetch(`${BASE}/api/public/prices`)).json();
  const english = prices.find((p) => p.slug === "english");
  ok("narxlar: ingliz tili bor", !!english, english ? `${english.monthlyPriceUzs} so'm` : "");

  // ── S-01: cookie'siz verify/resend rad etiladi
  const resend = await fetch(`${BASE}/api/auth/register/resend`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `${tag}@test.invalid` }) });
  ok("S-01: cookie'siz resend 400", resend.status === 400);

  // ── o'quvchi
  const u = await prisma.user.create({
    data: { username: tag, email: `${tag}@test.invalid`, firstName: "Smoke", lastName: "Test", birthYear: 2004, role: "STUDENT", emailVerifiedAt: new Date(), passwordHash: await hashPassword(PASS) },
  });
  userId = u.id;
  const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: tag, password: PASS }) });
  ok("login 200", login.status === 200);
  const setCookie = login.headers.getSetCookie();
  ok("sessiya cookie httpOnly", setCookie.some((c) => /httponly/i.test(c)));
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  const api = async (method, p, data) => {
    const r = await fetch(`${BASE}/api${p}`, { method, headers: { cookie, ...(data ? { "content-type": "application/json" } : {}) }, body: data ? JSON.stringify(data) : undefined });
    let body = null;
    try { body = await r.json(); } catch {}
    return { status: r.status, body };
  };
  const page = async (p) => (await fetch(`${BASE}${p}`, { headers: { cookie }, redirect: "manual" })).status;

  for (const p of ["/student", "/student/directions", "/student/progress", "/student/rewards", "/student/account", "/student/notebook", "/student/balance", "/grammar", `/u/${tag}`]) {
    ok(`sahifa ${p} 200`, (await page(p)) === 200);
  }

  const catalog = (await api("GET", "/learning/catalog")).body;
  const dir = (catalog?.directions ?? catalog ?? []).find?.((d) => d.slug === "english");
  ok("katalogda ingliz tili", !!dir);
  if (dir) {
    ok("yo'nalish tanlash", (await api("POST", "/learning/directions", { directionIds: [dir.id] })).status === 200);
    ok("0 dan boshlash", (await api("POST", `/learning/directions/${dir.id}/start-from-zero`)).status === 200);
    const ov = (await api("GET", "/learning/overview")).body;
    const d = ov?.directions?.find((x) => x.directionId === dir.id);
    const topics = d?.levels?.[0]?.topics ?? [];
    ok("A1 mavzulari bor", topics.length > 1, `${topics.length} ta`);
    if (english?.monthlyPriceUzs) {
      ok("pullik kurs: 1-mavzu bepul", topics[0]?.paywalled === false);
      ok("pullik kurs: 2-mavzudan obunasiz yopiq", topics.slice(1).every((t) => t.paywalled === true));
      ok("hasAccess=false", d?.hasAccess === false);
    }
  }

  const wallet = await api("GET", "/wallet");
  ok("balans 0", wallet.status === 200 && wallet.body.balanceUzs === 0);
  const courses = await api("GET", "/courses");
  ok("kurslar ro'yxati", courses.status === 200 && Array.isArray(courses.body.courses));
  const buy = await api("POST", `/courses/${dir?.id}/buy`, { idempotencyKey: `smk-${randomBytes(12).toString("hex")}` });
  ok("mablag'siz xarid → 402 INSUFFICIENT_FUNDS", buy.status === 402 && buy.body?.code === "INSUFFICIENT_FUNDS");

  const asset = await prisma.asset.findFirst({ select: { id: true } });
  if (asset) ok("media: nashr qilinmagan dars fayli o'quvchiga 404", (await api("GET", `/assets/${asset.id}`)).status === 404);

  ok("staff API o'quvchiga 403", (await api("GET", "/admin/catalog")).status === 403);
  ok("logout", (await api("POST", "/auth/logout")).status === 200);
  ok("logout'dan keyin API 401", (await api("GET", "/wallet")).status === 401);
}

try {
  await main();
} catch (e) {
  fail++;
  console.log(`FAIL  kutilmagan xato — ${e instanceof Error ? e.message : e}`);
} finally {
  if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  await prisma.$disconnect();
}
console.log(`\n${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
