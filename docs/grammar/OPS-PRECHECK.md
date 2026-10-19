# Operatsion pre-check (ADR-001 §11) — natija

> Sana: 2026-10-19. Bu hujjat **faktlarni** va **bilinmaydiganlarni** ajratadi. Production, hosting va GitHub haqida hech narsa taxmin qilinmagan.

## Tekshirilgan (lokal, koddan)

| Savol | Javob | Dalil |
|---|---|---|
| Postgres versiyasi (lokal) | 18; `pg_dump`/`pg_restore`/`psql` mavjud | `C:\Program Files\PostgreSQL\18\bin` |
| Migratsiyalar bo'sh bazaga qo'llanadimi | Ha (`prisma migrate deploy`, izolyatsiyalangan baza) | `izlan_g6`, `izlan_g7` |
| Dump → restore ishlaydimi, trigger'lar saqlanadimi | Ha (lokal mashq: 138 KB, ≈1 s, qatorlar mos, 9 trigger, append-only ishlaydi) | ADR §15.5 |
| Node talabi | Client `node --test` TS'ni to'g'ridan bajaradi (Node ≥22.18); server build Node 22 | package.json / CI |
| Server CI | `.github/workflows/ci.yml`: `verify`, **yangi** `grammar-db` (PostgreSQL xizmati) | YOZILGAN, **GitHub'da hech qachon ishga tushmagan** |

## BILINMAYDI (dalil yo'q — taxmin qilinmaydi)

| Savol | Holat | Kim to'ldiradi |
|---|---|---|
| Production DB qayerda (provayder, versiya) | [?] | egasi |
| Avtomatik zaxira bormi, jadvali, saqlash muddati, saqlash joyi | [?] | egasi |
| Production'da restore sinovi o'tkazilganmi | [?] — **yo'q deb hisoblanadi** | egasi |
| Staging muhiti | [?] — yo'q deb hisoblanadi; muqobil: izolyatsiyalangan DB + prod build (`client/e2e/grammar/README.md`) | egasi |
| Hosting Node versiyasi (≥22.18 kerak) | [?] | egasi |
| GitHub Actions haqiqiy bajarilishi, branch protection | [?] | egasi |
| `--actor` uchun pipeline akkaunti va sir saqlash | [?] | egasi |
| Huquqiy: CC BY-SA | [?] | yurist/egasi |

## Cutover uchun SHARTLAR (hammasi bajarilmaguncha cutover YO'Q)

1. Production DB'ning ishlaydigan zaxirasi va **haqiqiy restore sinovi** (vaqti, natijasi yozilgan).
2. `--backup-at` qiymati real zaxiradan olinadi.
3. CI ikkala repo'da haqiqiy yashil (bajarilgan run havolasi).
4. Hosting Node ≥22.18; `GRAMMAR_INTERNAL_TOKEN` sir sifatida sozlangan.
5. Huquqiy qaror (agar tashqi manbali qoidalar bo'lsa).
6. Staging/muqobil smoke: `client/e2e/grammar/README.md` bo'yicha E2E.

## Zaxira/tiklash mashqi (qayta bajarish)

```
pg_dump -Fc -d <manba> -f g.dump
createdb <yangi>
pg_restore -d <yangi> --no-owner g.dump
# trigger'lar: select count(*) from pg_trigger where tgname like 'Grammar%'   -- 9 kutiladi
# append-only: UPDATE "GrammarActivation" SET reason='x'                      -- xato berishi kerak
```
