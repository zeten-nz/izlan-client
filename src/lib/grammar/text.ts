// Til/yozuv yordamchilari (sof, dependency'siz): qidiruv normalizatsiyasi, urg'u, yozuv aniqlash.
//
// Qaror: murakkab lingvistik engine emas, balki aniq va tushunarli folding qoidalari:
//  - Unicode NFKD → (urg'u va lotin diakritiklari olib tashlanadi) → NFC. NFC/NFD kirishlari bir xil natija beradi.
//  - Kirill: urg'u belgisi (U+0301, U+0300) olib tashlanadi; ё → е (qidiruvda ikkalasi bir xil).
//    й saqlanadi (и dan farqli harf).
//  - Yapon: to'liq kenglikdagi lotin/raqam va yarim kenglikdagi kana NFKD orqali oddiy shaklga; katakana → hiragana.
//  - Lotin: diakritiklar olib tashlanadi; apostrof variantlari (' ’ ‘ ʻ ʼ ` ´) olib tashlanadi (o‘zbek: o', oʻ).

const COMBINING_STRESS = /[̀́]/g;
const LATIN_COMBINING = /([A-Za-z])[̀-ͯ]+/g;
const APOSTROPHES = /[`'’‘ʻʼ′´]/g;
const KATAKANA = /[ァ-ヶ]/g;

/** Katakana → hiragana (U+30A1–U+30F6 ↔ U+3041–U+3096). `ー` o'zgarmaydi. */
export function katakanaToHiragana(s: string): string {
  return s.replace(KATAKANA, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** Faqat urg'u belgilarini olib tashlaydi (matn mazmuni o'zgarmaydi: ё va й saqlanadi). Natija NFC. */
export function stripStress(s: string): string {
  return s.normalize("NFD").replace(COMBINING_STRESS, "").normalize("NFC");
}

/** Qidiruv uchun kanonik shakl. Bir xil so'zning turli yozilishlari bir xil qatorga keladi. */
export function foldForSearch(s: string): string {
  let t = s.normalize("NFKD");
  t = t.replace(COMBINING_STRESS, ""); // urg'u: молоко́ → молоко
  t = t.replace(/([еЕ])̈/g, "$1"); // ё → е
  t = t.replace(LATIN_COMBINING, "$1"); // lotin diakritiklari (é → e)
  t = t.normalize("NFC");
  t = katakanaToHiragana(t);
  return t
    .replace(APOSTROPHES, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim();
}

// ───────── yozuv aniqlash

const SCRIPT_RE = {
  Latn: /[A-Za-zÀ-ɏ]/,
  Cyrl: /[Ѐ-ԯ]/,
  Jpan: /[぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/,
} as const;
export type KnownScript = keyof typeof SCRIPT_RE;

export function hasScript(s: string, script: KnownScript): boolean {
  return SCRIPT_RE[script].test(s);
}

/** Matn berilgan yozuvlardan kamida bittasini o'z ichiga oladimi. */
export function hasAnyScript(s: string, scripts: readonly KnownScript[]): boolean {
  return scripts.some((sc) => hasScript(s, sc));
}

export const CYRILLIC_STRESS_MARK = "́";
