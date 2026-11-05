# Grammatika boshqaruvi: takrorlanuvchi E2E (haqiqiy backend, izolyatsiyalangan baza)

Bu skriptlar **loyiha dependency'si emas**: `playwright-core` va Chromium'ni alohida o'rnating (masalan `npm i --prefix <vaqtinchalik-papka> playwright-core`
va `NODE_PATH` yoki skriptlarni shu papkaga nusxalab ishga tushiring; Chromium yo'li `CHROME` muhit o'zgaruvchisida).
Ular **production/dev bazaga tegmaydi**: `prepare-db.cjs` baza nomi `izlan_g<N>` / `izlan_e2e*` / `izlan_test_ci` bo'lmasa to'xtaydi.

> Natijalar lokal. Bu skriptlar GitHub Actions'da ishga tushirilmagan.

## Tayyorlash

1. Alohida baza: `createdb izlan_g7` (yoki `izlan_e2e`).
2. Server: `cd server && npm run build && DATABASE_URL=<.../izlan_g7> npx prisma migrate deploy`.
3. Foydalanuvchilar va tozalash:
   `DATABASE_URL=<.../izlan_g7> node e2e/grammar/prepare-db.cjs users` va `... reset`.
4. Pilotlarni import (ixtiyoriy): `DATABASE_URL=<...> node dist/grammar/cli.js import --from ../client/content/grammar --apply` (server papkasida).
5. Server (port 4001): `DATABASE_URL=<...> PORT=4001 GRAMMAR_SOURCE=release GRAMMAR_INTERNAL_TOKEN=<>=16 belgi> node dist/main.js`.
6. Client prod build (foydalanuvchining `.next`iga tegmaslik uchun `NEXT_DIST_DIR`):
   `API_URL=http://127.0.0.1:4001 GRAMMAR_SOURCE=release GRAMMAR_INTERNAL_TOKEN=<...> GRAMMAR_ACTIVE_TTL_MS=3000 GRAMMAR_OVERLAY_TTL_MS=3000 NEXT_DIST_DIR=.next-e2e npx next build`
   so'ng xuddi shu muhit bilan `npx next start -p 3100`. (Build `tsconfig.json`ga `.next-e2e/types` qo'shadi — kerak bo'lmasa qaytaring.)

## Ishga tushirish (har safar `reset` + qayta import; client keshini tozalash uchun client'ni qayta ishga tushiring — 30 s gacha eski release eslab qolinadi)

```
DATABASE_URL=<.../izlan_g7> SERVER_DIR=../server BASE=http://localhost:3100 CHROME=<chrome.exe> node e2e/grammar/grammar-admin.e2e.mjs   # ~68 tekshiruv
DATABASE_URL=<.../izlan_g7> ... node e2e/grammar/failure.e2e.mjs                                                                       # backend uzilishi / fail-closed
BASE=http://localhost:3101 ... node e2e/grammar/devoverlay.e2e.mjs                                                                     # `next dev -p 3101` (NEXT_DIST_DIR=.next-e2e-dev) ustida: Suspense/hydration overlay
```
`grammar-admin.e2e.mjs` aktivlashni `node dist/grammar/cli.js activate` orqali bajaradi (UI'da aktivlash yo'q), shuning uchun `SERVER_DIR` va `DATABASE_URL` shart.
