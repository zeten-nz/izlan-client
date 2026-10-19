# Grammar Library: release, deploy va rollback runbook

Client (`izlan-client`) va server (`izlan-server`) **mustaqil** deploy qilinadi. Bu hujjat deploy tartibi, xavf modeli
va qaytarish (rollback) qoidalarini belgilaydi. Production'ga hech narsa avtomatik deploy qilinmaydi.

## 1. Tizim qanday ishlaydi (qisqa)

- Kontent manbasi: client repo (`content/grammar`). Build'da `src/generated/grammar-public.json` (faqat `approved`) va
  `src/generated/grammar-registry.json` (ID/status/sarlavha, server uchun) yaratiladi.
- Server reyestri: `server/src/grammar/grammar-registry.data.ts` (client'dan `npm run grammar:export-registry` bilan).
  Server uni yuklashda sxema va SHA-256 xeshni tekshiradi; yaroqsiz bo'lsa **fail-closed**.
- Dars hujjatida faqat `grammarRuleId`. O'quvchi ko'rinishini server reyestridan hal qiladi; havola client routing orqali ochiladi.
- Ustoz Studio nashr so'rovida reyestr versiyasini yuboradi; server mos kelmasa grammatikali darsni nashr qilmaydi (409).

## 2. Xavf modeli (nimadan himoya qilamiz)

| Tahdid | Ehtimol | Mavjud himoya | Qoldiq xavf |
|---|---|---|---|
| Tasodifiy buzilgan/yarim-deploy reyestr | Yuqori | SHA-256 xesh + sxema + fail-closed | — |
| Ikki repo versiya drifti (eski/yangi aralash) | Yuqori | versiya sarlavhasi (409), `grammar:compat`, release-gate | deploy oynasida qisqa 409 |
| Tasdiqlanmagan kontent chiqib ketishi | O'rta | status/siyosat validatsiyasi, public data faqat approved, izolyatsiya testlari | PR nazoratidan o'tib ketgan insoniy xato |
| Reviewer yozuvini soxtalashtirish (repo'ga yozish huquqi bor odam) | Past/O'rta | `reviewers.json` + CODEOWNERS + branch protection | **dastur ilovasi buni aniqlay olmaydi** |
| Reyestrni ruxsatsiz o'zgartirish (ataylab) | Past | repo huquqi, PR review | xesh kriptografik autentifikatsiya EMAS |
| Published dars havolasi buzilishi | O'rta | retire+replacement, fallback blok, ID doimiyligi | — |

### Xesh haqida
`version`/xesh **yaxlitlik** nazorati (tasodifiy o'zgarish, versiya aniqlash). U **autentifikatsiya emas**: reyestrni
o'zgartira oladigan odam xeshni ham qayta hisoblay oladi. Reyestr serverning o'z kodi bilan bir repo'da bo'lgani uchun,
unga yozish huquqi kodga yozish huquqi bilan teng; HMAC kalit ham shu muhitda turardi va qo'shimcha himoya bermasdi.

### Imzo (HMAC/asimmetrik) qachon kerak bo'ladi?
Faqat agar reyestr kod repo'sidan **tashqarida** (alohida servis/obyekt omborida) saqlansa yoki uni kod huquqi yo'q odamlar
(masalan admin panel) yangilasa. Shu holatda: reyestrni build'da CI maxfiy kaliti bilan imzolash, server ochiq kalit
bilan tekshirishi kerak. Hozirgi arxitekturada bu ortiqcha murakkablik; shuning uchun **qo'shilmagan** (qaror: tasdiqlanadi).

## 3. Deploy tartibi

**Qoida:** o'quvchi ko'rishi mumkin bo'lgan narsa avval tayyor bo'lishi kerak.

| O'zgarish | Tartib | Sabab |
|---|---|---|
| Yangi qoida `approved` | 1) client deploy 2) server deploy | Server ustozga tanlashga ruxsat bergan paytda client uni ochishi shart |
| Qoida `approved` → `review`/retire | 1) server deploy 2) client deploy | Avval yangi havolalar to'xtatiladi, keyin sahifa yopiladi; published darslar fallback oladi |
| Faqat matn/tuzatish (slug o'zgarmaydi) | faqat client | Reyestr o'zgarmaydi |
| Slug o'zgarishi | client (redirect bilan) | ID orqali ishlaydi, server o'zgarishi shart emas |
| Til yoqish (`enabled: true`) | 1) client 2) server | Qoidalar approved bo'lishi shart |
| Sxema/blok turi o'zgarishi | server, keyin client | Server yangi blokni qabul qilishi kerak |

### Release gate (har deploy oldidan)
GitHub → Actions → **Release gate (grammatika)** → `client_ref`, `server_ref`:
- client: `grammar:validate`, testlar, `tsc`, lint, build;
- server: testlar, `tsc`;
- `grammar:compat`: serverda approved bo'lgan har bir qoida client'da ham approved va til yoqilgan bo'lishi shart.

Deploy tugagach: shu workflow `require_identical=true` bilan qayta ishga tushiriladi (versiyalar bir xil).

Lokal: `npm run ci:local` (client) va `npm test` (server); cross-repo: `npm run grammar:compat -- ../server/src/grammar/grammar-registry.data.ts`.

## 4. Holatlar jadvali

| Holat | Nima bo'ladi | Harakat |
|---|---|---|
| Eski server + yangi client | Studio versiyasi mos emas → grammatikali dars nashri 409 (grammatikasizlari o'tadi); o'quvchi ko'rinishi to'g'ri | server'ni deploy qiling |
| Yangi server + eski client | Server yangi qoidani ruxsat bergan, client'da yo'q → o'quvchi darsda havolani bosganda "Qoida topilmadi" + "Darsga qaytish" | client'ni deploy qiling; oldini olish: §3 tartibi |
| Reyestr versiyalari bir xil | normal | — |
| Reyestr versiyalari turli | grammatikali nashr 409; mavjud darslar ishlaydi | kechikkan repo'ni deploy qiling |
| Qoida approved → review | yangi nashr rad; mavjud darslarda havola o'rniga "qoida hozircha mavjud emas" (dars davom etadi) | tuzatib qayta tasdiqlang |
| Qoida retired (+replacement) | eski darslarda almashtiruvchi qoida ko'rinadi; ID orqali URL almashtiruvchiga 308 | — |
| Retired (replacement'siz) | havolasiz fallback; URL 404 sahifa | darsni tuzatish |
| Deploy vaqtida drift | yuqoridagi qatorlar; hech qachon "buzilgan dars" yoki XP/progress yozuvi yo'q | — |
| Server reyestri yaroqsiz (xesh) | server loglarida xato; grammatikali nashr 503; o'quvchi havolalari fallback | oldingi buildga qayting |

## 5. Rollback

- **Client**: oldingi muvaffaqiyatli build'ga qaytish. Server reyestri client'dan oldinroq bo'lsa, §4 "Yangi server + eski client".
- **Server**: oldingi build'ga qaytish. Eski reyestr qoidalarni kamaytirishi mumkin: published darslar fallback oladi (dars buzilmaydi).
- **Kontent xatosi** (noto'g'ri qoida chiqib ketdi): 1) darhol `status: review` + server deploy (havola to'xtaydi) 2) client deploy (sahifa yopiladi) 3) tuzatib review'dan o'tkazish.
- DB migratsiyasi bu tizimda yo'q: rollback ma'lumotlarga ta'sir qilmaydi (LessonVersion snapshotlari o'zgarmaydi).

## 6. GitHub huquqlari

- Workflow'lar: `permissions: contents: read`.
- Cross-repo o'qish uchun **fine-grained PAT**: faqat bitta repo (`izlan-server` yoki `izlan-client`), `Contents: Read-only`,
  muddat cheklangan. Secret nomlari: `SERVER_REPO_READ_TOKEN` (client repo'da), `CLIENT_REPO_READ_TOKEN` (server repo'da).
- Token yo'q bo'lsa PR workflow'i ogohlantiradi (PASS emas), **release-gate esa FAIL bo'ladi**.
- Repo ko'rinishi (public/private) bu hujjat yozilganda tekshirilmagan; private bo'lsa token shart, public bo'lsa ham tavsiya etiladi.

## 9. DB rejimi (ADR-001): release, aktivlash, rollback, kill-switch

> Faqat `GRAMMAR_SOURCE=release` rejimida. Cutover hali bajarilmagan (ADR-001 §15.6).

**Muhit:** server `GRAMMAR_SOURCE=release`, `GRAMMAR_INTERNAL_TOKEN` (≥16 belgi); client `GRAMMAR_SOURCE=release`, bir xil `GRAMMAR_INTERNAL_TOKEN`, `API_URL`/`GRAMMAR_API_URL`, ixtiyoriy `GRAMMAR_ACTIVE_TTL_MS`/`GRAMMAR_OVERLAY_TTL_MS` (≤30000).

**Oqim:** Teacher/Admin yozadi → topshiradi → Admin tasdiqlaydi (APPROVED, hali ko'rinmaydi) → Admin UI'da *release nomzodi* (darvozalar: yaxlitlik, sxema, til, litsenziya, bog'liq ID, nafaqa) → **pipeline/CLI** aktivlaydi.

```
# 1) holat
node dist/grammar/cli.js status
# 2) nomzod: Admin UI yoki  node dist/grammar/cli.js candidate --note "..."
# 3) aktivlash (faqat boshqariladigan pipeline'dan). --backup-at: oxirgi muvaffaqiyatli zaxira vaqti (ISO, ≤24 soat)
node dist/grammar/cli.js activate --release <id> --expect-hash <snapshotHash> --actor pipeline:<nom> --reason "..." --backup-at 2026-10-19T08:00:00Z
```

**Rollback:** oldingi release'ni shu buyruq bilan qayta aktivlash (`action=ROLLBACK`, jurnalda qoladi). Bitta qoida uchun: `POST /admin/grammar/rules/:id/revert-candidate` yangi nomzod yaratadi (eski released revision pin) → CLI bilan aktivlanadi.

**Kill-switch:** Admin UI "Yashirish" (sabab majburiy) — release o'zgarmaydi, overlay'ga HIDE yoziladi. Ko'rinmay qolish kechikishi ≤ TTL (≤30 s) + bitta so'rov; **kafolat emas**. Backend uzilsa kontent ≤30 s eski holatda, so'ng yopiladi (fail-closed). Kontentni tahrirlashning yashirin yo'li yo'q.

**Import (bir martalik):** `node dist/grammar/cli.js import --from <content/grammar>` (dry-run), tekshirgach `--apply`. Hamma narsa DRAFT/AI_DRAFT; qayta ishga tushirish xavfsiz (idempotent); mavjud qoidani ustidan yozmaydi.

**Eksport/arxiv:** `node dist/grammar/cli.js export --release <id> --out <papka>` → `bundle.json` + qoida JSON'lari.

**Tiklash mashqi / zaxira:** `OPS-PRECHECK.md`.
