# Grammar Library kontenti (0-bosqich)

Bu papka `/grammar` bo'limining manbasi. Sahifalar hali yaratilmagan (1-bosqich).

## Tuzilma

```
languages.json            # tillar reyestri: daraja tizimi, kategoriyalar, ruxsat etilgan bloklar, enabled
redirects.json            # eski slug → ID; retired (nafaqadagi) ID'lar
manifest.json             # GENERATSIYA QILINADI: npm run grammar:manifest (qo'lda tahrirlamang)
<lang>/<papka>/rule.json  # til/tushuntirishdan mustaqil: id, slug, kategoriya, daraja, related
<lang>/<papka>/<uz>.mdx   # tushuntirish: JSON frontmatter (--- orasida) + MDX tana
```

## Qoidalar

- **ID** (`gr_<til>_<6 raqam>`) doimiy: o'zgartirilmaydi, qayta ishlatilmaydi, o'chirilmaydi. Keraksiz qoida `redirects.json` → `retired` ga o'tkaziladi.
- **Slug** o'zgarsa: eski slug `redirects.json` ga qo'shiladi.
- **Status:** `draft` → `review` → `approved`. Faqat `approved` ommaga chiqadi; u uchun `review` ma'lumoti (kim, qachon) va kamida 2 ta misol shart.
- **Tushuntirish tili** fayl nomi bilan belgilanadi (`uz.mdx`); o'rganilayotgan til papka nomi (`en/`).
- **MDX tanasi:** faqat oddiy markdown va `<Callout tone="info|warning|tip">`. `import`/`export`, `{ }`, xom HTML, rasm va `javascript:` havolalar taqiqlangan.
- Misollar, istisnolar, xatolar va jadvallar frontmatter'da (tuzilgan ma'lumot sifatida validatsiya qilinadi).

## Buyruqlar (client/ ichida)

```
npm run grammar:validate   # sxema + kross-tekshiruvlar + manifest dolzarbligi (xato bo'lsa exit 1)
npm run grammar:manifest   # manifest.json ni qayta yaratadi
npm run test:grammar       # validatsiya testlari
```

## Tasdiqlash va release (4-bosqich)

- Siyosat, reviewer qo'llanmasi, taklif jarayoni: [docs/grammar/GOVERNANCE.md](../../docs/grammar/GOVERNANCE.md)
- Deploy tartibi, xavf modeli, rollback: [docs/grammar/RELEASE-RUNBOOK.md](../../docs/grammar/RELEASE-RUNBOOK.md)
- `reviewers.json` — tasdiqlash huquqi bor shaxslar (hozir bo'sh: hech kim `approved` qila olmaydi).
- `npm run grammar:report` (holat/yetishmayotgan bandlar), `npm run grammar:hash -- <fayl>` (reviewer uchun xesh),
  `npm run grammar:compat -- <server reyestri>` (release darvozasi).
