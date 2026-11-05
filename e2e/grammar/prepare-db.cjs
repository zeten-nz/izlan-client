/* eslint-disable @typescript-eslint/no-require-imports */
// E2E uchun IZOLYATSIYALANGAN bazani tayyorlaydi. Production/dev bazaga hech qachon tegmaydi:
// baza nomi izlan_g<N> | izlan_e2e* | izlan_test_ci bo'lmasa to'xtaydi.
//   DATABASE_URL=postgresql://.../izlan_g7 node prepare-db.cjs users   — 5 ta test foydalanuvchi (admin1/2, teacher1/2, student1)
//   DATABASE_URL=postgresql://.../izlan_g7 node prepare-db.cjs reset   — grammatika jadvallari va audit tozalanadi
// SERVER_DIR — server papkasi (standart ../../../server); u oldindan `npm run build` va `prisma migrate deploy` qilingan bo'lishi kerak.
const path = require("node:path");
const SERVER = path.resolve(process.env.SERVER_DIR ?? path.join(__dirname, "../../../server"));
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL kerak");
const name = new URL(url).pathname.replace(/^\//, "");
if (!/^izlan_(g\d+|e2e\w*|test_ci)$/.test(name)) throw new Error(`Xavfsizlik: baza nomi mos emas (${name})`);
const { PrismaClient } = require(path.join(SERVER, "node_modules/@prisma/client"));
const { hashPassword } = require(path.join(SERVER, "dist/auth/crypto.util.js"));

(async () => {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const cmd = process.argv[2];
  if (cmd === "users") {
    const hash = await hashPassword(process.env.E2E_PASSWORD ?? "Grm-Test-2026!");
    for (const [u, role] of [["admin1", "ADMIN"], ["admin2", "ADMIN"], ["teacher1", "TEACHER"], ["teacher2", "TEACHER"], ["student1", "STUDENT"]]) {
      await prisma.user.upsert({
        where: { username: u },
        create: { username: u, email: `${u}@example.test`, firstName: u, lastName: "Test", birthYear: 1995, passwordHash: hash, role, emailVerifiedAt: new Date() },
        update: {},
      });
    }
    console.log("foydalanuvchilar tayyor");
  } else if (cmd === "reset") {
    await prisma.$executeRawUnsafe(
      `TRUNCATE "GrammarActivation","GrammarOverlayEvent","GrammarReleaseItem","GrammarRelease","GrammarReviewEvent","GrammarRevision","GrammarSlugAlias","GrammarRule","GrammarIdCounter","GrammarLanguage","GrammarImportRun","AuditLog" RESTART IDENTITY CASCADE`,
    );
    console.log("grammatika jadvallari tozalandi");
  } else throw new Error("buyruq: users | reset");
  await prisma.$disconnect();
})();
