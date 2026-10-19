# ADR-001: Grammar Library — PostgreSQL manba, immutable release va aktivlashtirish

Holat: **qaror loyihasi, foydalanuvchi qarorlari kiritilgan** (2026-10-19). Implementatsiya, schema va migration YO'Q.
Bu hujjat 1-bosqich natijasi. Keyingi bosqich (2) foydalanuvchi tasdig'idan keyin boshlanadi.

Belgilar: **[Q]** foydalanuvchi qarori, **[T]** tavsiya (tasdiq kerak), **[?]** tekshirilmagan/ochiq.

## 1. Qarorlar (foydalanuvchidan)

| # | Qaror |
|---|---|
| D1 | PostgreSQL — yagona kontent manbasi [Q]. Git `content/grammar` production runtime uchun ikkinchi manba emas [Q]. |
| D2 | Production'da aktivlashtirish faqat deploy pipeline yoki nazorat qilinadigan CLI orqali. Admin UI ko'radi, tasdiqlaydi, release candidate tayyorlaydi; production'da aktivlashtirmaydi [Q]. |
| D3 | R2 avval spike bilan tekshiriladi, R1 zaxira. Yakuniy tanlov spike natijalari, xavfsizlik, rollback va operatsion murakkablik asosida [Q]. |
| D4 | `APPROVED` ≠ `RELEASED`. Tasdiqlash kontentni o'quvchiga ko'rsatmaydi [Q]. |
| D5 | Faqat ADMIN tasdiqlaydi; admin o'zi yaratganini o'zi tasdiqlashi mumkin; ikkinchi tasdiqlovchi talab qilinmaydi; har tasdiqda user ID, vaqt, revision ID, audit saqlanadi [Q]. Reviewer keyinroq, hozir qurilmaydi. |
| D6 | Teacher: yangi qoida yaratadi; faqat o'zining tasdiqlanmagan loyihasini tahrirlaydi; boshqa Teacher qoidalarini ko'radi, tahrirlay olmaydi; approved/released'ga revision yubora olmaydi; `IN_REVIEW`ni `DRAFT`ga qaytaradi; hech qachon tasdiqlanmagan o'z qoralamasini o'chiradi (soft delete + audit); approved/released'ni o'chira olmaydi. Hammasi serverda ham tekshiriladi [Q]. |
| D7 | Kill-switch: release ma'lumotidan alohida overlay; TTL ≤ 30 s; 30 s kafolat EMAS; kesh/polling/xato holatlari spike/test rejasida; kontent tahrirlashning yashirin yo'li bo'lmasin [Q]. |
| D8 | Pilotlar `DRAFT` + "AI qoralama" provenance; import hech qachon approve qilmaydi; idempotent; ID/slug alias/redirect/lesson reference saqlanadi [Q]. |
| D9 | Backup va staging mavjudligi faraz qilinmaydi: avval tekshirish bosqichi; backup+restore tekshirilmasdan cutover yo'q [Q]. |
| D10 | Tashqi manba: URL, muallif, litsenziya, attribution saqlanadi; CC BY-SA oldidan tekshiruv jarayoni; AI/tashqi/original farqlanadi; huquqiy noaniqlik taxmin bilan hal qilinmaydi [Q]. |
| D11 | Cutover'dan keyin Git — arxiv; DB va Git'dan parallel o'qish yo'q [Q]. |
| D12 | `grammarRuleId`, `grammarRef`, `schemaVersion: 1`, darslar, player, XP/IZL, quiz, progress o'zgarmaydi; approved revision immutable; muhim status o'zgarishi audit'ga [Q]. |
| D13 | Teacher o'z `IN_REVIEW`ini qaytaradi va tasdiqlanmagan qoralamasini soft-delete qiladi (oldingi savol 10: "ha") [Q]. |

Sharhlangan ikki nuqta (tasdiq so'raladi, §13): "boshqa Teacher qoidalarini ko'ra olsa" = faqat o'qish (qoralamalar ham); admin o'z-o'zini tasdiqlashi `selfApproved` belgisi bilan audit'ga yoziladi.

## 2. Kontekst (koddan, faktlar)

- Hozir kontent client repo fayllarida (`content/grammar/**`), build'da `src/generated/grammar-public.json` va `grammar-registry.json`; server `src/grammar/grammar-registry.data.ts` (generatsiya, SHA-256 yaxlitlik).
- Dars: `server/src/lessons/doc.schema.ts › grammarRefBlock` faqat `grammarRuleId`; nashr `staff-lessons.service.ts › publish` + `grammar-check.ts`; o'quvchi `player.ts`.
- Ruxsat: faqat `Role {STUDENT TEACHER ADMIN}`; granular ruxsat yo'q. Mavjud andozalar: `AuditLog`, `rev` optimistik qulf, advisory lock, DELETED/ARCHIVED/BLOCKED o'chirish, append-only trigger (`XpLedger`).
- Repo'larda Docker, compose, deploy konfiguratsiyasi, backup yoki staging haqida hech qanday fayl/eslatma **topilmadi** (grep). Production muhiti haqida ma'lumot yo'q [?].

## 3. Holat modeli (aralashtirmaslik)

**Revision (versiya) workflow holati** — `GrammarRevision.status`:
`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `REJECTED`, `APPROVED`.
O'tishlar: `DRAFT→IN_REVIEW` (muallif), `IN_REVIEW→DRAFT` (muallif, qaytarib olish), `IN_REVIEW→APPROVED|CHANGES_REQUESTED|REJECTED` (ADMIN), `CHANGES_REQUESTED→IN_REVIEW` (muallif). `APPROVED`, `REJECTED`, `IN_REVIEW` da kontent o'zgarmaydi. Boshqa o'tish yo'q.
"Soft deleted" — `deletedAt` (status emas): faqat hech qachon `APPROVED`/released bo'lmagan revision/qoida.

**RELEASED status emas.** Revision "released" = aktiv release'ning `GrammarReleaseItem`ida bor. "Production'da hozir nima ko'rinadi" savoliga yagona javob — aktiv release (§5.4).

**Rule darajasi:**
- `state`: `OPEN` | `RETIRED` (doimiy; `replacedById` ixtiyoriy; release orqali kuchga kiradi).
- `hidden` — kill-switch overlay (§7), release'dan tashqari, qaytariladi.
- "Hech qachon approved bo'lmagan" hosilaviy.

## 4. Ruxsatlar (hammasi serverda; UI faqat ko'rsatadi)

| Amal | Student | Teacher | Admin |
|---|---|---|---|
| Aktiv release kontentini o'qish | ✔ | ✔ | ✔ |
| Qoida va birinchi `DRAFT` yaratish | ✖ | ✔ | ✔ |
| Boshqa Teacher qoidasini **o'qish** (ro'yxat, kontent) | ✖ | ✔ (faqat o'qish) | ✔ |
| O'z `DRAFT`/`CHANGES_REQUESTED` tahriri | ✖ | ✔ (faqat o'ziniki) | ✔ |
| Boshqa muallif loyihasini tahrirlash | ✖ | ✖ (403, mavjudligini ko'rsatmaydi tahrirda) | ✔ (u muharrir sifatida yoziladi) |
| `DRAFT→IN_REVIEW`, `IN_REVIEW→DRAFT` | ✖ | ✔ (o'ziniki) | ✔ |
| Tasdiqlanmagan o'z qoralamasini soft-delete | ✖ | ✔ (hech qachon approved bo'lmagan va hech qaerda ishlatilmagan) | ✔ (xuddi shunday shart) |
| Approved/released qoidaga yangi revision, approved/released'ni o'chirish | ✖ | ✖ | revision ✔ (ADMIN), o'chirish ✖ (retire orqali) |
| Tasdiqlash / tuzatish so'rash / rad | ✖ | ✖ | ✔ (o'zi yozganini ham; `selfApproved` audit belgisi) |
| Hide/unhide (kill-switch), retire (sabab majburiy) | ✖ | ✖ | ✔ |
| Release candidate yaratish, diff, ta'sir tahlili | ✖ | ✖ | ✔ |
| Release aktivlashtirish / rollback (production) | ✖ | ✖ | ✖ UI'dan; faqat pipeline/CLI |

Tasdiqlashda server tekshiradi: revision `IN_REVIEW`; admin ko'rgan `contentHash` hozirgi hash'ga teng (TOCTOU); sxema+lint; manbalar/provenance/litsenziya holati (§9); shartli `UPDATE ... WHERE status='IN_REVIEW'`. Yozadi: `approvedById`, `approvedAt`, `approvedRevisionId`, `approvedHash`, `selfApproved`, `GrammarReviewEvent`, `AuditLog`.
Kengayish: barcha qarorlar bitta modulda (`canEdit/canSubmit/canApprove/canHide`); keyin reviewer = shu funksiyaga yangi shart + bitta jadval. Hozir qurilmaydi.

## 5. Release arxitekturasi

### 5.1 Variantlar
- **R2 (spike birinchi, asosiy nomzod):** DB'da immutable release snapshot; kontent release ID bo'yicha serverdan o'qiladi va keshlanadi; aktiv release — yagona ko'rsatkich. Kod deploy'idan alohida, lekin darvozalar bilan bog'langan.
- **R1 (zaxira):** deploy payti DB'dagi approved'lardan artifact (`grammar-release-N.json`) yaratilib client build'iga kiradi; server shu release'ni yuklaydi.

Eslatma: R1 ham DB'ni manba qoldiradi; Git'dan runtime o'qish yo'q (D1, D11).

### 5.2 Nima uchun spike kerak (R2 taxminlari tekshirilmagan [?])
1. Release kontenti ichki (cookie'siz, server-server tokenli) endpointdan `use cache` + `releaseId` bilan keshlanadimi (`cacheComponents`).
2. Proxy slug-xaritasini TTL bilan keshlab real 404/308 beradimi.
3. Next client router keshi (`x-nextjs-stale-time: 300` kuzatilgan) kill-switch'ni kechiktiradimi; `staleTimes` sozlamasi yetarlimi.
4. 1000 qoidali indeks/bundle hajmi va javob vaqti; jsonb "qoida darsda ishlatilyaptimi" so'rovi tezligi.
5. Aktivlashtirish poygalari va xatolar (§8).

### 5.3 Tanlov mezonlari (spike'dan keyin to'ldiriladi)
Xavfsizlik (kill-switch kechikishi, yangi sirlar), rollback tezligi, operatsion murakkablik (pipeline, tokenlar, runtime bog'liqlik), ishlash (LCP, kesh), mavjud kodga ta'sir (proxy, `cacheComponents`). Spike hisoboti R1/R2 jadvalini va tavsiyani beradi; yakuniy qaror sizda.

### 5.4 Aktiv revision/release'ni ishonchli aniqlash (R1 va R2 uchun umumiy)
- **Yagona haqiqat manbai:** `GrammarActivation` append-only jurnali; aktiv release = oxirgi yozuv (yozish advisory lock ostida, `seq` qat'iy o'sadi).
- Har yozuv: `releaseId`, `snapshotHash`, amal (`ACTIVATE`/`ROLLBACK`), aktor (pipeline/CLI identifikatori), sabab, vaqt, oldingi release.
- `GET /grammar/release-status` (ichki/healthcheck): `{releaseId, seq, snapshotHash, activatedAt}`; har kontent javobi `X-Grammar-Release: <releaseId>` sarlavhasini qaytaradi.
- **Deploy-dan keyin tekshiruv** (pipeline qadami): tashqaridan status endpointi chaqiriladi, kutilgan `releaseId/snapshotHash` bilan solishtiriladi; mos kelmasa pipeline FAIL va avtomatik rollback buyrug'i ko'rsatiladi.
- Admin UI "Production holati": aktiv release, uning elementlari (qoida→revision ID), aktivlashtirish tarixi (faqat o'qish).
- Qaysi **revision** aktiv: `GrammarReleaseItem(releaseId, ruleId, revisionId)` — har qoida uchun aniq.

### 5.5 Release candidate va darvozalar
Candidate = hozirgi approved revisionlardan yaratilgan, hali aktiv bo'lmagan snapshot. Darvozalar (hammasi bajarilmasa aktivlashtirib bo'lmaydi):
1. Har item revisioni `APPROVED` va `approvedHash` = hozirgi hash (qayta hisob).
2. Server sxemasi + markdown lint + ruby/stress tekshiruvlari.
3. Manbalar/provenance/litsenziya holati (§9): `UNRESOLVED`/`BLOCKED` bo'lsa rad.
4. `related` ID'lar release ichida; retired'ning replacement'i mavjud; ID qayta ishlatilmagan.
5. Til konfiguratsiyasi to'g'ri; `contentSchemaVersion` ≤ server qo'llab-quvvatlaydigani.
6. **Diff** (qo'shilgan/o'zgargan/olib tashlangan/retired/hidden) va **darslarga ta'siri**: olib tashlanayotgan/retire/yashirilayotgan qoida qaysi nashr qilingan darslarda ishlatilmoqda.
7. Soft-deleted/`REJECTED` revision kirmaydi.

### 5.6 Rollback
- **To'liq:** oldingi release'ni qayta aktivlashtirish (jurnalga yangi `ROLLBACK` yozuvi). Release'lar o'chirilmaydi.
- **Qoida bo'yicha:** "qoidani eski **released** revisioniga qaytarish" = yangi candidate: aktiv release nusxasi, shu qoida elementi eski revisionga almashtirilgan (revision immutable `APPROVED`); darvozalar; aktivlashtirish. Revision pointer'i joyida o'zgartirilmaydi.
- Rollback ham pipeline/CLI orqali (D2). Favqulodda to'xtatish uchun kill-switch (§7).

### 5.7 Darslar bilan moslik
`GrammarService` interfeysi (`lookup`, `resolveForPlayer`, `listSelectable`) saqlanadi; manbasi aktiv release. Teacher darsga faqat **aktiv release'dagi** (ko'rinadigan) qoidani bog'laydi: shunda approved-lekin-hali-released qoida darsga bog'lanmaydi. Retire → replacement yoki fallback; kill-switch/rollback → fallback. Nashr qilingan dars buzilmaydi (hujjatda faqat ID, `schemaVersion` 1).

## 6. Ma'lumotlar modeli (loyiha; schema fayli YO'Q)

| Jadval | Vazifa | Invariantlar |
|---|---|---|
| `GrammarLanguage` | til konfiguratsiyasi (kod, nom, `enabled`, daraja tizimi, yozuv, kategoriyalar) | release'ga muzlatiladi; o'zgarish faqat yangi release orqali ko'rinadi |
| `GrammarRule` | barqaror identifikatsiya: `id` (`gr_<til>_<6 raqam>`, hozirgi format), `lang`, `slug`, `category`, daraja (+`confirmed`), `state` (OPEN/RETIRED), `replacedById`, `createdById?` + `createdLabel`, `deletedAt/By/Reason` | `id` o'zgarmas, qayta ishlatilmaydi; `(lang,slug)` unikal (jonli); soft-delete faqat hech qachon approved bo'lmaganda |
| `GrammarSlugAlias` | eski slug → qoida | 308 uchun; import hozirgi `redirects`ni saqlaydi |
| `GrammarIdCounter` | `lang → keyingi raqam` | advisory lock; import paytida mavjud maksimumdan keyin |
| `GrammarRevision` | o'zgarmas revision tarixi: `ruleId`, `explanationLang`, `revisionNo`, `status`, `rev`, `content` JSON (+`contentSchemaVersion`), `contentHash`, `authorId?`/`authorLabel`, `provenance`, `lastEditedById`, `submittedAt`, `approvedById/At`, `approvedHash`, `selfApproved`, `checks` JSON, `deletedAt` | `(ruleId,lang,revisionNo)` unikal; `IN_REVIEW/APPROVED/REJECTED`da `content` o'zgarmaydi (DB trigger); `approvedHash = contentHash` |
| `GrammarReviewEvent` | append-only workflow tarixi (amal, eski/yangi status, aktor, izoh) | o'zgartirilmaydi/o'chirilmaydi; har status o'zgarishi shu yerda va `AuditLog`da |
| `GrammarRelease` | immutable snapshot: `seq`, `createdById`, `createdAt`, `contentSchemaVersion`, `languages` JSON, `snapshotHash`, `validation` JSON, `baseReleaseId`, `note` | yaratilgach o'zgarmaydi |
| `GrammarReleaseItem` | `(releaseId, ruleId, revisionId)` + muzlatilgan rule metadata (slug, kategoriya, daraja, retired/replacedBy) | har qoida release'da ko'pi bilan bir marta; revision `APPROVED` |
| `GrammarActivation` | append-only aktivlashtirish jurnali (§5.4) | aktiv = oxirgi; yozuvlar o'chirilmaydi |
| `GrammarOverlayEvent` | append-only kill-switch jurnali: `ruleId`, `HIDE/UNHIDE`, aktor, sabab, vaqt (+monoton `overlayVersion`) | joriy holat = qoida bo'yicha oxirgi hodisa; kontentni o'zgartira olmaydi |
| `GrammarImportRun` | import urinishi: `id`, manba, boshlangan/tugagan, natija hisobot JSON | idempotentlik va qayta urinish uchun (§10) |

Tashlab yuborilgan: reviewer grant, rule'da `publishedRevisionId`. Foydalanish ("darsda ishlatilyaptimi") boshida jsonb so'rovi (`LessonVersion.doc`); sekin bo'lsa keyin indeks jadvali (spike'da o'lchanadi).
JSON/ustun: workflow, filtr, ruxsat, hash — ustun; kontent tuzilmasi butunlay o'qiladi — JSON.

Audit hodisalari (minimum): qoida/revision yaratildi, tahrir (faqat meta, kontent matnisiz), topshirildi, qaytarib olindi, tasdiqlandi (`selfApproved`), tuzatish so'raldi, rad etildi, soft-delete, retire, hide/unhide, release candidate yaratildi, aktivlashtirildi, rollback, import.

## 7. Kill-switch (overlay)

**Maqsad:** release jarayonini kutmasdan qoidani yashirish. **Chegara:** faqat `ruleId` bo'yicha "ko'rsatma" (`HIDE/UNHIDE`) — hech qanday kontent maydoni yo'q; sabab majburiy; ADMIN; audit. Kontent o'zgarishi faqat revision → approve → release orqali (overlay kontentni o'zgartira olmaydi, uning jadvalida kontent ustuni yo'q).

**Yetkazish:** server `GET /internal/grammar/overlay` → `{overlayVersion, hiddenIds[]}` (`no-store`); client uni polling/qisqa TTL bilan o'qiydi (**TTL ≤ 30 s**); server tomonida `GrammarService` (dars hal qilish) overlay'ni har so'rovda DB'dan o'qiydi (kuchli).

**30 s kafolat emas.** Eng yomon kechikish = TTL + tarmoq/so'rov kechikishi + oraliq keshlar. Kafolat bermaydigan holatlar:
- Next client router keshi / RSC prefetch (kuzatilgan stale-time 300 s) — yangi sahifa yuklashgacha eski sahifa ko'rinishi mumkin.
- Allaqachon ochiq tab.
- Overlay endpointi/DB xatosi, tarmoq uzilishi.
- Ko'p instansda turli holat.
- Release aktivlashtirish bilan bir vaqtda hide.

**Xato siyosati (taklif [T], spike'da sinaladi):**
- Overlay olinmasa: oxirgi muvaffaqiyatli overlay faqat **TTL chegarasigacha** ishlatiladi.
- Chegaradan keyin ham olinmasa — **fail-closed**: grammatika sahifalari "vaqtincha mavjud emas" ko'rsatadi (hide qilingan kontent oshkor bo'lmaydi). Dars ichidagi havola serverda hal qilinadi (fallback).
- `overlayVersion` pasaysa yoki sakrasa — ogohlantirish va qayta o'qish.

**Spike/test rejasiga (§8) kiritiladi:** TTL o'lchovi, kesh qatlamlari, polling, xatolik/uzilish, poyga, ochiq tab, router keshi, har instans.

## 8. Spike (2-bosqich oldi tasdiq bilan; tashlab yuboriladigan kod, repo'ga kirmaydi, izolyatsiyalangan lokal DB)

| # | Sinov | O'lchanadi / qabul |
|---|---|---|
| S1 | Release kontenti: ichki endpoint + `use cache` + `releaseId`, `cacheComponents`, dev overlay | kesh hit, kontent oqimi, Suspense xatosiz |
| S2 | Proxy slug-xaritasi TTL kesh | real 404/308 saqlanadi; kesh yangilanishi |
| S3 | Kill-switch: hide → ko'rinmaslik vaqti (yangi yuklash, refresh, prefetch/router kesh, ochiq tab) | p50/p95/max vaqt; `staleTimes` sozlamasi ta'siri; hujjatlashtirilgan qoldiq oyna |
| S4 | Overlay xatolari: endpoint 5xx, DB uzilishi, sekin javob | fail-closed ishlaydi; stale chegarasi |
| S5 | Aktivlashtirish poygasi: parallel aktivlashtirish, aktivlashtirish paytida o'qish, rollback | yagona aktiv; yarim holat ko'rinmaydi |
| S6 | 1000 qoida: indeks/bundle hajmi, javob vaqti, LCP | byudjet: sahifa LCP regressiyasi yo'q (qiymat spike'da kelishiladi) |
| S7 | jsonb foydalanish so'rovi (sintetik dars hajmi) | tezlik; indeks jadvali kerakmi |
| S8 | R1 uchun: build artifact olish (token), server/client release mosligi | murakkablik va xavf baholanadi |

Natija: o'lchangan raqamlar jadvali, R1/R2 taqqoslash (§5.3), tavsiya.

## 9. Litsenziya va provenance

Har revisionda `provenance` (bitta qiymat): `AI_DRAFT`, `ORIGINAL`, `EXTERNAL`, `MIXED`, `UNKNOWN`.
Har manbada (`sources[]`): `url`, `author`, `license` (SPDX id yoki `original`/`unknown`), `attribution` (matn), `retrievedAt`, `shareAlike` (bool), `licenseReview` (`UNRESOLVED` | `ALLOWED` | `BLOCKED`, kim va qachon, izoh).
Qoidalar:
- `AI_DRAFT`/`UNKNOWN` approve qilinishi mumkin, lekin release'da ko'rinmaydi (yorliq sahifada); tasdiqlashda admin bandni tasdiqlaydi.
- `EXTERNAL` (yoki `shareAlike`): `licenseReview = ALLOWED` bo'lmaguncha release candidate darvozasi **rad etadi**.
- CC BY-SA: avval jarayon: litsenziyaning rasmiy matni o'qiladi va saqlanadi; ShareAlike Izlan kontentini shu litsenziyada chiqarishni talab qilishi mumkin, bu **huquqiy savol — ochiq (§13)**, taxmin bilan hal qilinmaydi.
- Attribution matni sahifada ko'rsatiladi (talab bo'lsa).

## 10. Pilot importi (Git/MDX → DB), idempotent

- Kirish: `content/grammar` (hozirgi, validatsiyadan o'tgan korpus). Natija: faqat `DRAFT`, `authorId = NULL`, `authorLabel = "AI qoralama (Claude), tekshirilmagan"`, `provenance = AI_DRAFT`. **Hech qachon approve yoki release.**
- Idempotent kalit: `(ruleId, explanationLang, contentHash)`. Mavjud bo'lsa — hech narsa; hash farq qilsa — yangi `DRAFT` revision (eski o'zgarmaydi). Dublikat qoida yaratilmaydi (`ruleId` unikal).
- Saqlanadi: `ruleId` (ID hisoblagichi maksimumdan keyin), `slug`, slug alias/redirect, retired ro'yxati, daraja (+`confirmed`), kategoriya. Darslar tegilmaydi: ular faqat ID saqlaydi.
- Tartib: **dry-run** (hisobot: yaratiladigan/o'zgaradigan/o'tkazib yuboriladigan, xatolar) → faqat siz ko'rgach haqiqiy run. Har qoida alohida tranzaksiya; `GrammarImportRun` natija hisoboti.
- Tekshiruv (har runda): qoidalar/revisionlar soni, ID to'plami tengligi, normalizatsiyalangan kontent hash'i manbaga teng, redirect/retired to'plami teng, hech biri `APPROVED` emas, mavjud darslardagi `grammarRuleId`lar hal qilinadi.
- Xato: noto'g'ri qoida butun runni to'xtatmaydi (hisobotga yoziladi); xavfsiz qayta urinish — xuddi shu komanda (idempotent); qisman natija qoldirmaydi (qoida darajasida atomik).
- Teskari yo'l (eksport): release → JSON/MDX (arxiv/zaxira).

## 11. Backup va staging (faraz qilinmaydi)

**Hozirgi holat [?]:** repo'larda backup/staging/Docker konfiguratsiyasi yo'q; production muhiti noma'lum. Lokal DB'lar mavjud (dev/test), production emas.

**Pre-check (2-bosqich, implementatsiyadan oldin) — yozma javoblar/dalillar:**
1. Production DB qayerda (provayder), versiya, ulanish.
2. Backup jadvali (to'liq/inkremental/PITR), retention, saqlash joyi, shifrlash, kim javobgar.
3. **Restore jarayoni hujjati va tiklash sinovi** (amalda bajarilgan, vaqt/RPO/RTO o'lchangan).
4. Staging mavjudmi; migration ularda qanday sinaladi.
5. Hosting/Node versiyasi, CI'ning haqiqiy bajarilishi (hamon hech qachon ishlamagan).

**Staging yo'q bo'lsa variantlar:** (a) alohida staging muhiti (alohida DB+deploy, produktiv ma'lumotsiz); (b) xavfsiz muqobil: production backup'dan tiklangan **izolyatsiyalangan nusxa** (maxfiy ma'lumot maskalanadi) + lokal/ephemeral muhit; (c) migration va release'ni lokal izolyatsiyalangan DB'da sinash (hozirgi E2E andozasi) — faqat qo'shimcha, staging o'rnini bosmaydi.

**Shart (blokirovka):** backup siyosati va restore sinovi hujjatlashtirilib dalil bilan ko'rsatilmaguncha production cutover (Git yo'lini o'chirish, DB-source yoqish) **yo'q**. Release aktivlashtirishdan oldin ham so'nggi backup vaqti tekshiriladi.

## 12. Git arxiv va yagona manba

- Cutover'gacha: Git — import manbasi (bir tomonlama, qo'lda ishga tushiriladi).
- Cutover'dan keyin: `content/grammar` → `archive/grammar-content/` (faqat o'qish, README: sana, oxirgi release, "runtime manbasi emas"). Client build uni o'qimaydi.
- Parallel o'qish taqiqi: `GRAMMAR_SOURCE` bitta qiymat (production'da faqat `release`); dual-mode faqat nosticli paritet testlarida (xizmat ko'rsatmaydi); CI/test: runtime kodida arxiv yo'lini import/o'qish yo'qligini tekshiradi.
- Git'dan boshqa import faqat aniq belgilangan, hujjatlashtirilgan run (§10) orqali.
- Stage 3–4 mexanizmlari (`grammar-registry.data.ts`, `export-registry`, `check-registry`, `compat`, `x-grammar-registry`, `reviewers.json`, kontent hash frontmatter) cutover'dan keyin olib tashlanadi (alohida tasdiq); o'tish davrida bayroq bilan saqlanadi.

## 13. Ochiq masalalar (taxmin qilinmaydi)

1. **Huquqiy:** CC BY-SA/ShareAlike manbalarni Izlan kontentida ishlatish shartlari va natijaviy litsenziya talabi — yurist/egasi qarori kerak [?].
2. Boshqa Teacher'ning **qoralamalarini** ko'rish (faqat o'qish) maxfiylik nuqtai nazaridan maqbulmi (hozir ko'rsatmaga muvofiq "ha" deb olingan) — tasdiq.
3. Admin o'zini o'zi tasdiqlashi `selfApproved` belgisi bilan: qo'shimcha cheklov (masalan, release candidate'da ko'rsatish) kerakmi.
4. Pipeline/CLI identifikatsiyasi: aktivlashtirish kim nomidan (servis akkaunt/token) va qanday sir saqlanadi [?].
5. Production hosting, backup, staging, CI — pre-check natijasi [?].
6. Spike natijasidan keyin R1 yoki R2.
7. Kill-switch fail-closed xatti-harakati (grammatika sahifalarini vaqtincha yopish) maqbulmi.
8. Cutover'dan keyin arxiv papkasi joyi va saqlash muddati.
9. `contentSchemaVersion` siyosati (faqat qo'shimcha o'zgarishlar) tasdiqlanadimi.

## 14. Bosqichlar (har biri tasdiq bilan; avvalgi rejadan yangilangan)

| # | Bosqich | Natija / qabul mezoni | Testlar | Xavf / rollback | Keyingisi uchun tasdiq |
|---|---|---|---|---|---|
| 1 | **ADR va model dizayni** (shu hujjat) | Qarorlar, model, release, ruxsat, kill-switch, import, backup/staging yo'li, ochiq masalalar yozma | hujjat ko'rib chiqish | Kod yo'q; rollback shart emas | ADR tasdiqi |
| 2 | **Operatsion pre-check** | §11 savollariga dalilli javoblar: backup siyosati, restore sinovi, staging/muqobil, hosting/Node, CI haqiqiy bajarilishi | yozma dalil + restore sinovi bayonnomasi | Xavf: javoblar yo'q → implementatsiya bloklanadi | pre-check natijasi |
| 3 | **Spike** (§8) | S1–S8 raqamlar; R1/R2 tavsiyasi | spike skriptlari (repo'ga kirmaydi) | Xavf: R2 amaliy emas → R1 | spike natijasi va tanlov |
| 4 | **Schema va migration** | Jadvallar, trigger'lar, indekslar; izolyatsiyalangan DB'da `migrate deploy`; down-yo'l | schema/trigger testlari (rad etilgan yozuvlar) | Xavf: noto'g'ri migration; backup va down-SQL | migration yaratishga alohida ruxsat |
| 5 | **Server yadro** | Server sxemasi, lint, hash, holat mashinasi, ruxsat modul, servislar, audit, ID ajratish, soft-delete | unit + izolyatsiyalangan DB integratsiya; Teacher/Admin ruxsat matritsasi; 409; XSS | Yangi modul; eski yo'l tegilmagan | natija |
| 6 | **Release engine** | candidate, darvozalar, diff, ta'sir, aktivlashtirish CLI, rollback (to'liq va qoida bo'yicha), `GrammarActivation`, status endpointi, kill-switch overlay, `GrammarService` bayroq ortida | unit + integratsiya + poyga; Stage 3 dars senariylari release manbasida | bayroq `static`ga | natija |
| 7 | **Import/eksport** | §10 | import testlari (idempotentlik, xato, qayta urinish), paritet | dry-run; tozalash faqat izolyatsiyada | dry-run hisobot |
| 8 | **Client o'qish yo'li** | `/grammar/**` release API'dan, qidiruv, 404/308, proxy, overlay; bayroq | E2E paritet, Suspense overlay, kill-switch vaqt sinovi | bayroq `static` | cutover alohida tasdiq (backup+restore sharti) |
| 9 | **Teacher UI** | Mening qoidalarim, boshqalarniki (faqat o'qish), muharrir, topshirish/qaytarish, soft-delete, feedback | E2E + server ruxsat testlari | route'lar bayroq ortida | natija |
| 10 | **Admin UI** | dashboard, ro'yxat, navbat, diff, tasdiqlash/tuzatish/rad, hide/retire, release candidate/diff/ta'sir, "Production holati", tarix | E2E + konkurrensiya + XSS | route'lar bayroq ortida | natija |
| 11 | **Yakuniy E2E, xavfsizlik, regressiya** | takrorlanuvchi E2E repo'da; dars yaratish/publish/complete+XP regressiyasi; kill-switch xato holatlari | to'liq to'plam | — | natija |
| 12 | **Cutover va production** | backup+restore dalili; birinchi release; Git arxivga; Stage 3–4 mexanizmlarini olib tashlash; runbook yangilash; CI haqiqiy yashil | staging/muqobil smoke, restore sinovi | oldingi release/bayroq/backup | production release'ga alohida tasdiq |

Bog'liqlik: 1→2→3→4→5→6; 7 va 8 → 6; 9, 10 → 5–6; 11 → hammasi; 12 → 2 (backup/restore), 8, 11.

## 15. Implementatsiya holati va dalillar (2026-10-19, FAQAT lokal; production/CI natijasi EMAS)

> Bu bo'lim ADR tasdiqlangandan keyin bajarilgan ishning faktlari. "Lokal" = izolyatsiyalangan PostgreSQL 18 bazalari (`izlan_g6`, `izlan_g7`, `izlan_g8`), alohida server (port 4001) va client prod build (3100). Hech qanday production/dev ma'lumotlar bazasiga tegilmagan. Haqiqiy GitHub Actions ishga tushmagan.

### 15.1 Qaror: R2 (runtime-served immutable release + aktiv ko'rsatkich)
Spike (haqiqiy client kodi + stub server, keyin haqiqiy backend) natijalari:

| # | Sinov | Natija |
|---|---|---|
| S2 | 404/308 | `proxy.ts` orqali real 404 (statik `/grammar-missing` rewrite) va 308 (query saqlanadi) release rejimida ham ishlaydi |
| S3a | Kill-switch kechikishi | HIDE → yangi so'rovda 404: TTL ichida (spike: TTL 15 s → ≈15.2 s); E2E (TTL 3 s): ≈5.3 s (TTL + kutish + bitta so'rov) |
| S3b | Router cache | SPA'da TTL ichida eski kontent ko'rinishi mumkin (kutilgan); TTL'dan keyin ro'yxatda link yo'q; orqaga qaytishda "Qoida topilmadi" (router cache eski kontentni saqlamadi) |
| S4 | Uzilish | `active`/`overlay` xato bersa eski qiymat ≤30 s ishlatiladi, undan keyin **fail-closed** (stub bilan o'lchandi); tiklanish ≈1–3 s. Real backend sinovida auth ham backendga tayanadi: kirgan foydalanuvchi uchun uzilish darhol `/login`'ga olib keladi (kontent ko'rinmaydi) |
| S5 | Aktivlash poygasi | Parallel `activate` advisory lock bilan ketma-ketlashadi; `previousReleaseId` zanjiri uzilmaydi (integratsiya testi) |
| S6 | Hajm | 1000 sintetik qoida: bundle ≈11 MB JSON; birinchi `/grammar/en` 695 ms, keyingisi ≈45–55 ms; ro'yxat HTML ≈1 MB → **1000+ qoidada ro'yxat sahifalash / yengil indeks kerak** (qoldiq xavf) |
| S7 | Foydalanish so'rovi | `jsonb_path_exists(... '$.** ? (@.grammarRuleId == $id)')` ishlaydi (integratsiya testi); katta hajmda tezligi o'lchanmagan (indeks jadvali keyingi qadam) |
| S1 | Dev Suspense overlay | Yangi async sahifalarda 10/10 toza. Topilgan va tuzatilgan muammolar: (1) `/grammar` bosh sahifa runtime fetch'ni Suspense'siz kutardi → til ro'yxati `<Suspense>` ichiga olindi; (2) `Date.now()` cacheComponents prerender'ida build'ni sindirdi → TTL `performance.now()`ga o'tdi; (3) `toLocaleString` hydration nomuvofiqligi → aniq `Intl` (Asia/Tashkent) |

**Tavsiya: R2.** Sabab: deploy'siz rollback (aktiv ko'rsatkich almashadi), immutable release + audit jurnali, kill-switch alohida overlay, bitta manba. R1 (build-time artifact) zaxira sifatida hujjatlashtirilgan, lekin implementatsiya qilinmagan. Narx: runtime bog'liqlik (API uzilsa fail-closed), ≤30 s kechikish (kafolat emas).

### 15.2 Nima qurildi
- **Schema + migration** `20261019104339_grammar_content_release`: 11 jadval + DB trigger'lar (revision holat mashinasi va o'zgarmaslik, append-only jadvallar, release item faqat APPROVED revision'ga, hisoblagich kamaymaydi, qoida hard-delete yo'q, RETIRED qaytmaydi). Trigger'lar zaxira-tiklashdan keyin saqlanishi tekshirilgan (§15.5).
- **Server** (`server/src/grammar`): `content.schema.ts` (zod3, strict, provenance/litsenziya maydonlari), `permissions.ts` (yagona ruxsat joyi; `canApprove` kengaytma nuqtasi), `state-machine.ts`, `content.service.ts`, `release.service.ts` (candidate darvozalari, diff, dars ta'siri, per-rule revert nomzodi, aktivlash/rollback, bundle), `grammar.service.ts` (`GRAMMAR_SOURCE=static|release`), `grammar.controllers.ts` (staff / admin / internal), `import-export.ts`, `cli.ts`.
- **Client**: `data.ts` (release rejimi), `error.tsx` (fail-closed UI), Teacher UI (`/teacher/grammar`, `/new`, `/[ruleId]`), Admin UI (`/admin/grammar`, `/new`, `/[ruleId]` ko'rib chiqish paneli, `/releases`), `features/grammar-admin/*`.
- **Aktivlash faqat CLI**: HTTP'da `activate` endpointi YO'Q. `node dist/grammar/cli.js activate --release --expect-hash --actor --reason --backup-at` (zaxira vaqti ≤24 soat; `--allow-no-backup` productionda taqiqlangan).

### 15.3 D-qarorlarning bajarilishi
D1 yagona manba: `GRAMMAR_SOURCE` bitta qiymat, parallel o'qish yo'q · D2 UI aktivlamaydi (tugma ham, endpoint ham yo'q) · D4 APPROVED≠RELEASED (E2E: approved qoida student va ustoz katalogida ko'rinmaydi) · D5 faqat ADMIN; o'zi yozganini tasdiqlasa `selfApproved` + `revision.approve.self` audit · D6/D13 Teacher faqat o'z DRAFT/CHANGES_REQUESTED'ini tahrirlaydi, boshqalarniki faqat o'qish, approved'ga revision ocholmaydi, IN_REVIEW'ni qaytarib oladi, never-approved o'zinikini soft-delete qiladi (hammasi serverda; E2E'da 403'lar) · D7 kill-switch overlay (append-only, TTL ≤30 s, server reyestri ham hisobga oladi) · D8 pilotlar DRAFT/AI_DRAFT, import approve qilmaydi, idempotent · D9 zaxira/staging faraz qilinmagan (§15.5, `OPS-PRECHECK.md`) · D10 litsenziya darvozasi: ShareAlike/tashqi manba `ALLOWED` bo'lmaguncha release bloklanadi (huquqiy qaror o'z o'rnida) · D11/D12 ID, `grammarRef`, `schemaVersion:1` o'zgarmagan.

### 15.4 Test dalillari (lokal)
- Server: `npm test` → 143 test (126 o'tdi, 17 DB testi `GRAMMAR_TEST_DATABASE_URL`siz o'tkazib yuboriladi); DB bilan (`izlan_g6`): grammatika bo'yicha 27/27 o'tdi.
- Client: 163/163 unit test.
- E2E (haqiqiy backend `izlan_g7` + prod build, Chromium): `grammar-admin.e2e.mjs` 68/68; `failure.e2e.mjs` 4/4; dev overlay `devoverlay.e2e.mjs` 10/10.
- Regressiya (static rejim, fixture build + mock API): `e2e4` (ru/ja) to'liq o'tdi; `e2e3` 98/100 (2 ta tasdiq fixture ma'lumotiga bog'liq: fixture'da `ru` approved bo'lgani uchun `/grammar/ru` 404 kutgan tasdiq 200 oldi); `e2e2` eski (guest-login qaroridan oldingi) tasdiqlar tufayli muvaffaqiyatsiz. Bularni **regressiya emas** deb baholaymiz, lekin eski bosqichdagi aniq muhitni qayta tiklay olmaganimiz uchun bu baho taxmin.

### 15.5 Zaxira / tiklash (lokal mashq, production dalili EMAS)
`pg_dump -Fc izlan_g7` (138 KB) → yangi bazaga `pg_restore` ≈1 s; barcha grammatika jadvallarida qatorlar soni mos; 9 ta trigger tiklangan va append-only himoyasi ishlaydi. Production uchun hanuz kerak: zaxira jadvali, saqlash muddati, tashqi saqlash joyi, haqiqiy restore sinovi — `OPS-PRECHECK.md`.

### 15.6 Ochiq / bloklangan (§13 ga qo'shimcha)
- **Cutover (12-bosqich) bajarilmadi va bajarib bo'lmaydi**: production zaxira + restore dalili, staging, haqiqiy CI bajarilishi yo'q.
- Huquqiy qaror (CC BY-SA) ochiq; shunday manbali qoidalar release'ga o'tmaydi.
- Pipeline identifikatsiyasi (`--actor`) va maxfiy token saqlash joyi belgilanmagan.
- `GRAMMAR_INTERNAL_TOKEN` productionda ≥16 belgi tasodifiy sir bo'lishi shart; token yo'q bo'lsa ichki API 503 qaytaradi (fail-closed).
- 1000+ qoidada ro'yxat sahifalash; foydalanish so'rovi indeksi.
- Release pipeline holatini avtomatik kuzatuvchi monitoring yo'q.

### 15.7 Yakuniy qayta tekshiruv (2026-10-19, kechqurun; FAQAT lokal)
- Xavfsizlik: `safeHref` `/\host` ni rad etadi (brauzer `\`ni `/` deb o'qiydi → open redirect); `mdx-lint` (client+server, paritet) havola manzilini allowlist (`/…`, `https:`, `mailto:`) bilan tekshiradi. Regressiya testi qo'shildi.
- Server `npm test` izolyatsiyalangan bazada (`GRAMMAR_TEST_DATABASE_URL`) 143/143 (skip 0); client 163/163; ikkala `tsc` toza.
- Yangi izolyatsiyalangan baza + prod build bilan E2E: `grammar-admin` 68/68, `lesson-regression` 10/10, `failure` 4/4, `devoverlay` 10/10.
- Dev baza `izlan_db`: avval `pg_dump -Fc` zaxirasi, so'ng `20261019104339_grammar_content_release` qo'llandi (`migrate status`: up to date). Dev bazaga import/aktivlash QILINMAGAN.
