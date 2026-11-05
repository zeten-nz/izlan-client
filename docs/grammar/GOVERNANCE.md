# Grammar Library: kontent boshqaruvi (governance)

> Muhim: dastur faqat **jarayon bajarilganini** tekshiradi (kim yozdi, kim tekshirdi, kontent tekshiruvdan keyin o'zgardimi).
> **Grammatik to'g'rilikni dastur tasdiqlamaydi.** To'g'rilikka faqat tayinlangan reviewer (metodist) javob beradi.

## 1. Rollar

| Rol | Kim | Nima qila oladi |
|---|---|---|
| Muallif | ustoz, kontent yozuvchi (yoki AI qoralama) | `draft`/`review` kontent yozadi, PR ochadi |
| Reviewer | `content/grammar/reviewers.json`dagi shaxs | kontentni tekshiradi va `approved` qiladi (faqat o'z tillari uchun) |
| Reviewer tayinlovchi | loyiha egasi | `reviewers.json`ga yangi reviewer qo'shadi (PR + CODEOWNERS) |

**Hozirgi holat:** `reviewers.json` bo'sh. Metodist tayinlanmaguncha hech bir qoida `approved` bo'la olmaydi
(validator buni rad etadi). Reviewer nomini yoki tasdig'ini to'qib yozish mumkin emas va taqiqlangan.

## 2. Holatlar

`draft` → `review` → `approved`. Foydalanuvchiga faqat `approved` (va yoqilgan til) ko'rinadi.

`approved` uchun MAJBURIY (build'da tekshiriladi, `npm run grammar:validate`):

1. `author`: kontent muallifi (reviewer'dan farqli shaxs).
2. `sources`: kamida bitta manba, har birida `license` (o'zimiz yozgan bo'lsa `"original"`).
3. `review.reviewedBy`: `reviewers.json`dagi ID, va u shu tilga (`languages`) tayinlangan.
4. `review.checks`: `grammar`, `examples`, `translations`, `level` hammasi `true` (reviewer shaxsan belgilaydi).
5. `review.reviewedRevision` = joriy `revision`.
6. `review.contentHash` = joriy kontent xeshi (`npm run grammar:hash -- <fayl>`).
7. Kamida 2 ta misol.
8. Daraja `confirmed: true` faqat approved tarjimasi bor qoidada.

### Kontent o'zgarsa nima bo'ladi
Tekshiruvdan keyin frontmatter yoki matn o'zgarsa `contentHash` mos kelmaydi → build to'xtaydi.
Muallif `revision`ni oshiradi va statusni `review`ga qaytaradi; reviewer qayta tekshirib xesh/revision yozadi.
`manifest.json` (git'da) oldingi xeshni saqlaydi: kontent o'zgargan, lekin `revision` oshmagan bo'lsa ham build to'xtaydi.

## 3. Reviewer uchun qo'llanma

1. PR'dagi `npm run grammar:report` natijasini oching: nima yetishmayapti ko'rsatiladi.
2. Tekshiring:
   - Qoida tavsifi va formulalar to'g'rimi? Istisnolar to'liq va to'g'rimi?
   - Har bir misol grammatik to'g'ri va tabiiymi? O'zbekcha tarjima to'g'rimi?
   - Rus tilida urg'u, ja tilida furigana/o'qilishi to'g'rimi?
   - Daraja (CEFR/JLPT) mosligi: ishonchingiz komil bo'lmasa `level.confirmed`ni `true` qilmang.
   - Manba va litsenziya: nusxa ko'chirish (mualliflik huquqi) yo'qmi? ShareAlike manba bo'lsa, loyiha egasiga murojaat qiling.
3. Xatolik topsangiz PR'da izoh yozing; kontentni o'zingiz tahrir qilsangiz, o'zingiz muallif bo'lib qolasiz va
   tasdiqlay olmaysiz (boshqa reviewer kerak).
4. Hammasi to'g'ri bo'lsa: `npm run grammar:hash -- <fayl>` natijasini `review.contentHash`ga, `revision`ni
   `review.reviewedRevision`ga, ismingizni `review.reviewedBy`ga (ID), bugungi sanani `reviewedAt`ga yozing,
   `checks`ni belgilang va `status: "approved"` qiling.
5. PR'ni tasdiqlang (GitHub Review → Approve). Reviewer GitHub akkaunti `CODEOWNERS`da bo'lishi kerak.

## 4. Git PR orqali approval jarayoni (amaliy)

- `main` branch protection: PR majburiy, `CI / verify` status check majburiy, CODEOWNERS review majburiy.
- `CODEOWNERS`: `content/grammar/reviewers.json` va `content/grammar/**/*.mdx` uchun metodistlar jamoasi.
- `.github/pull_request_template.md` reviewer checklistini PR'ga chiqaradi.

**Cheklov (yashirilmaydi):** dastur PR'ni GitHub'da kim tasdiqlaganini bilmaydi. `review.reviewedBy` — bu fayl ichidagi
yozuv; uni kim yozgani Git tarixi va CODEOWNERS/branch protection orqali nazorat qilinadi. Repo'ga yozish huquqi bor
odam `reviewers.json`ni va review blokini o'zi tahrirlay oladi. Shuning uchun **branch protection + CODEOWNERS majburiy**;
bularsiz tizim faqat tasodifiy xatolardan himoya qiladi, ataylab buzishdan emas.

## 5. O'qituvchilar MDX tahrir qilmasdan kontent taklif qilishi

`.github/ISSUE_TEMPLATE/grammar-proposal.yml` — GitHub'da forma: qoida nomi, til, tavsif, misollar, manba, litsenziya.
Ustoz formani to'ldiradi (Git bilmasdan); tahrirchi uni MDX qoralamaga aylantiradi (`status: draft`, `author` = ustoz ismi).
Hozircha bu yetarli. Admin panel kerak bo'ladigan chegaralar (taklif):

| Belgi | Git/MDX yetarli | Admin panel kerak |
|---|---|---|
| Qoidalar soni | < ~300 | minglab |
| Muharrirlar | 1–3 texnik odam | ko'p ustoz, texnik bo'lmagan |
| Review tezligi | haftalik | kunlik, navbat va SLA |
| Tarix/audit | git log yetarli | DB audit jurnali, mualliflik statistikasi |
| Real vaqt yangilash | har o'zgarishda deploy bo'lsa bo'ladi | redeploysiz yangilash kerak |

Admin panel qurilsa: kontent PostgreSQL'ga ko'chiriladi (alohida loyiha, bu hujjat doirasida emas). Hozir qurilmaydi.

## 6. Ochiq litsenziyali datasetlarni import qilish

Hech narsa litsenziya matni o'qilmasdan import qilinmaydi (`content/grammar/_sources/irregular-verbs-audit.md`).
Tartib:
1. Manba litsenziyasining **rasmiy matni** o'qiladi va `_sources/` ga yoziladi (manba, versiya, litsenziya, sana).
2. ShareAlike (CC BY-SA) manba bo'lsa: Izlan kontenti ham shu litsenziyada chiqishi shart: loyiha egasi qarori kerak.
3. Import skripti mavjud sxemaga (`schema.ts`) yozadi; natija `status: "draft"`, `sources[]` to'ldirilgan holda PR bo'ladi.
4. Avtomatik import hech qachon `approved` qilmaydi; reviewer baribir §3 bo'yicha tekshiradi.
5. Fe'l shakllari kabi faktlar uchun tavsiya: o'zimiz yozib reviewer tekshiradi, manba faqat taqqoslash uchun.

## 7. ID, slug va retire siyosati

- ID (`gr_<til>_<raqam>`) abadiy; hech qachon qayta ishlatilmaydi. `retired` ro'yxatidagi ID qayta berilmaydi (validator rad etadi).
- Slug o'zgarsa: eski slug `redirects.json`ga yoziladi.
- Qoida o'chirilmaydi: `retired`ga o'tkaziladi (`replacedBy` bilan yoki bo'sh). Published darslarda: replacement bo'lsa o'quvchi
  almashtiruvchi qoidani ko'radi, bo'lmasa havolasiz fallback ("qoida hozircha mavjud emas"), dars buzilmaydi.
- `approved` → `review` qaytarish: serverga reyestr yetib borguncha o'quvchi 404 ko'rmasligi uchun
  RELEASE-RUNBOOK.md dagi tartibga qarang.
