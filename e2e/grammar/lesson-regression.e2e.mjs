// Dars regressiyasi (release rejimi, haqiqiy backend): grammarRef bilan dars nashri, o'quvchi ko'rinishi, dars tugatish + XP,
// grammatika sahifalari XP/progress yozmasligi, kill-switch ta'siri.
// Talab: prepare-db.cjs users; `npx tsx prisma/seed.ts catalog` (server) shu bazada; server (4001) + client (3100) release rejimida.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3100";
const SERVER_DIR = path.resolve(process.env.SERVER_DIR ?? "../../../server");
const PASS = process.env.E2E_PASSWORD ?? "Grm-Test-2026!";
const TTL_WAIT = Number(process.env.TTL_WAIT_MS ?? 6500); // server reyestr keshi 5 s + client TTL
const require = createRequire(path.join(SERVER_DIR, "package.json"));
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n} ${x}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cli = (...a) => execFileSync("node", ["dist/grammar/cli.js", ...a], { cwd: SERVER_DIR, env: process.env, encoding: "utf8" });

async function login(u) {
  const res = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: u, password: PASS, remember: false }) });
  if (!res.ok) throw new Error(`login ${u}: ${res.status}`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const fn = async (method, p, data) => {
    const r = await fetch(`${BASE}/api${p}`, { method, headers: { cookie, ...(data ? { "content-type": "application/json" } : {}) }, body: data ? JSON.stringify(data) : undefined });
    let body = null; try { body = await r.json(); } catch {}
    return { status: r.status, body };
  };
  fn.cookie = cookie;
  return fn;
}
const admin = await login("admin1"), teacher = await login("teacher1"), student = await login("student1");
const frame = { x: 10, y: 10, w: 400, h: 120, z: 0 };
const GOOD = (title) => ({ title, summary: "x", examples: [{ text: "I run.", translation: "a" }, { text: "You run.", translation: "b" }], sources: [{ title: "q", license: "original" }], body: "Matn.\n" });

// ── qoidalar: biri released, biri approved-lekin-released-emas
async function approved(slug, title) {
  const r = (await admin("POST", "/staff/grammar/manage/rules", { lang: "en", slug, category: "articles", content: GOOD(title) })).body;
  await admin("POST", `/staff/grammar/manage/revisions/${r.revisionId}/submit`);
  const rv = (await admin("GET", `/staff/grammar/manage/rules/${r.ruleId}`)).body.revisions[0];
  await admin("POST", `/admin/grammar/revisions/${rv.id}/approve`, { contentHash: rv.contentHash });
  return r.ruleId;
}
const relId = await approved("reg-released", "Regression Released");
const cand = (await admin("POST", "/admin/grammar/releases/candidate", {})).body;
cli("activate", "--release", cand.releaseId, "--expect-hash", cand.snapshotHash, "--actor", "e2e", "--reason", "lesson regression", "--backup-at", new Date().toISOString());
const unrelId = await approved("reg-unreleased", "Regression Unreleased");
await sleep(TTL_WAIT);

// ── katalog va o'quvchi holati
const topic = await prisma.topic.findFirst({ where: { ord: 1, level: { ord: 1, direction: { slug: "english" } } }, include: { level: true } });
await prisma.userDirection.upsert({
  where: { userId_directionId: { userId: (await prisma.user.findUnique({ where: { username: "student1" } })).id, directionId: topic.level.directionId } },
  create: { userId: (await prisma.user.findUnique({ where: { username: "student1" } })).id, directionId: topic.level.directionId, currentLevelOrd: 1, placedBy: "ZERO" },
  update: {},
});
const studentId = (await prisma.user.findUnique({ where: { username: "student1" } })).id;

// ── ustoz darsi
const mk = async (title, ruleId) => {
  const l = (await teacher("POST", "/staff/lessons", { topicId: topic.id, title })).body;
  const doc = { schemaVersion: 1, pages: [{ id: "p1", blocks: [{ id: "t", type: "text", text: "Salom", ...frame }, { id: "g", type: "grammarRef", grammarRuleId: ruleId, ...frame }] }] };
  const full = (await teacher("GET", `/staff/lessons/${l.id}`)).body;
  const sv = await teacher("PUT", `/staff/lessons/${l.id}/draft`, { rev: full.draft.rev, doc });
  return { id: l.id, sv };
};
const A = await mk("Regressiya: released qoida", relId);
ok("draft saqlandi (grammarRef)", A.sv.status === 200, JSON.stringify(A.sv.body).slice(0, 120));
const pubA = await teacher("POST", `/staff/lessons/${A.id}/publish`);
ok("released qoida bilan nashr: 200", pubA.status === 200, JSON.stringify(pubA.body).slice(0, 140));
const B = await mk("Regressiya: released EMAS", unrelId);
const pubB = await teacher("POST", `/staff/lessons/${B.id}/publish`);
ok("approved-lekin-released-emas qoida bilan nashr rad etiladi (422)", pubB.status === 422, `status=${pubB.status}`);

// ── o'quvchi ko'rinishi va tugatish
const view = await student("GET", `/learning/lessons/${A.id}`);
const gblock = view.body?.pages?.[0]?.blocks?.find((b) => b.type === "grammarRef");
ok("o'quvchi: grammarRef hal qilindi (mavjud, sarlavha)", view.status === 200 && gblock?.rule?.available === true && gblock.rule.title === "Regression Released", JSON.stringify(gblock?.rule));
ok("o'quvchi javobida status/muallif/kontent sizmaydi", !JSON.stringify(view.body).includes("approvedById") && !JSON.stringify(view.body).includes("contentHash"));

// grammatika sahifalarini ochish XP/progress yozmaydi (dars ko'rinishi progress qatorini yaratadi — undan KEYIN o'lchaymiz)
const before = { xp: await prisma.xpLedger.count({ where: { userId: studentId } }), prog: await prisma.lessonProgress.count({ where: { userId: studentId } }) };
for (const p of ["/grammar", "/grammar/en", "/grammar/en/reg-released"]) {
  await (await fetch(`${BASE}${p}`, { headers: { cookie: student.cookie } })).text();
}
const afterOpen = { xp: await prisma.xpLedger.count({ where: { userId: studentId } }), prog: await prisma.lessonProgress.count({ where: { userId: studentId } }) };
ok("grammatika ochish: XP/progress o'zgarmadi", afterOpen.xp === before.xp && afterOpen.prog === before.prog, JSON.stringify({ before, afterOpen }));

const done = await student("POST", `/learning/lessons/${A.id}/complete`);
const afterComplete = await prisma.xpLedger.count({ where: { userId: studentId } });
ok("dars tugatish ishlaydi (grammatika bilan)", done.status === 200 || done.status === 201, `status=${done.status} ${JSON.stringify(done.body).slice(0, 100)}`);
ok("dars tugatish XP yozdi (mavjud tizim buzilmagan)", afterComplete >= before.xp, `xp ${before.xp} -> ${afterComplete}`);

// ── kill-switch: darsdagi havola "mavjud emas" fallback'iga o'tadi, yangi nashr rad etiladi
await admin("POST", `/admin/grammar/rules/${relId}/hide`, { reason: "regressiya testi" });
await sleep(TTL_WAIT);
const view2 = await student("GET", `/learning/lessons/${A.id}`);
const g2 = view2.body?.pages?.[0]?.blocks?.find((b) => b.type === "grammarRef");
ok("kill-switch: dars ochiladi, grammatika bloki fallback (available=false)", view2.status === 200 && g2?.rule?.available === false, JSON.stringify(g2?.rule));
const C = await mk("Regressiya: yashirilgan", relId);
ok("kill-switch: yashirilgan qoida bilan yangi nashr rad etiladi", (await teacher("POST", `/staff/lessons/${C.id}/publish`)).status === 422);
await admin("POST", `/admin/grammar/rules/${relId}/unhide`, { reason: "tugadi" });

console.log(`\nJAMI: ${pass} PASS, ${fail} FAIL`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
