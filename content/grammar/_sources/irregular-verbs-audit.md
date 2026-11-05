# Noto'g'ri fe'llar: ma'lumot manbalari auditi

Sana: 2026-10-15. Holat: **hech qanday ma'lumot import qilinmagan.** Quyidagi manbalarning litsenziyasi tekshirildi; "tasdiqlanmagan" — rasmiy litsenziya matni ko'rilmagan, shuning uchun import qilinmaydi.

| Manba | Litsenziya | Holat | Izoh |
|---|---|---|---|
| Wiktionary: Appendix:Irregular verbs:English | CC BY-SA (odatda 4.0 + GFDL), rasmiy sahifa tekshirilmagan | **Tasdiqlanmagan** | ShareAlike: hosila ma'lumot ham shu litsenziyada bo'lishi kerak. Izlan kontentiga ta'sir qiladi. |
| Wikipedia: List of English irregular verbs | CC BY-SA (odatda), sahifa aniq tekshirilmagan | **Tasdiqlanmagan** | Xuddi shu ShareAlike muammosi. |
| npm `english-verbs-irregular` (RosaeNLG) | Paket: Apache-2.0; ma'lumot manbasi aniqlanmagan | **Tasdiqlanmagan** | Paket deprecated. Ma'lumotning kelib chiqishi (WordNet bo'lishi mumkin) tasdiqlanmagan. |
| WordNet 3.0 (`verb.exc`) | Princeton WordNet litsenziyasi: har qanday maqsadda erkin, nusxada mualliflik xabari saqlansin | Litsenziya aniq, **ammo** `verb.exc` — inflektsiya istisnolari, o'quv jadvali emas | Faqat tekshiruv/taqqoslash uchun yaroqli; `go/went/gone` kabi uch shaklli jadvalni to'liq bermaydi. Foydalanilsa, xabar saqlanishi shart. |
| LanguageTool ma'lumotlari | Dastur: LGPL 2.1+; ma'lumot fayli alohida tekshirilmagan | **Tasdiqlanmagan** | Dastur litsenziyasi ma'lumotga o'tmasligi mumkin. |
| UniMorph (ingliz) | Ikkilamchi manbalar CC BY-SA 3.0 deydi; rasmiy fayl tekshirilmagan | **Tasdiqlanmagan** | ShareAlike. |

## Tavsiya

1. **Ro'yxatni o'zimiz yozamiz** va metodist tekshiradi. Fe'l shakllari (go-went-gone) faktlar; o'z ifodamiz va o'z tuzilishimiz bo'lsa, tashqi litsenziya majburiyati paydo bo'lmaydi.
2. Tashqi manbalar faqat **solishtirish** uchun (nusxa ko'chirmasdan).
3. Agar biror manbadan import qilinsa, avval rasmiy litsenziya matni o'qiladi va `SOURCES` yozuvi (manba, versiya, litsenziya, sana) shu papkaga qo'shiladi.
4. ShareAlike (CC BY-SA) manbadan import faqat Izlan kontentini shu litsenziyada chiqarishga tayyor bo'lsangiz mumkin. Bu biznes qarori.

## Arxitektura (amalga oshirilmagan)

- Yangi blok turi `verbs`: `{ base, past[], participle[], translation, note?, region? }`; bir nechta shakl (dreamed/dreamt) massiv.
- Alohida qoida (`irregular-verbs` kategoriyasi), o'z `status`/`review` bilan.
- Sahifada alifbo bo'yicha guruhlash va mavjud qidiruvdan foydalanish.
