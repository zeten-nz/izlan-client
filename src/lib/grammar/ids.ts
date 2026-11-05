// Grammatika qoidalarining doimiy ID'si: `gr_<til>_<6 xonali tartib raqami>`, masalan `gr_en_000001`.
// ID slug'dan mustaqil: slug o'zgarishi mumkin, ID hech qachon o'zgarmaydi va qayta ishlatilmaydi.

export const LANG_RE = /^[a-z]{2,3}$/;
export const RULE_ID_RE = /^gr_([a-z]{2,3})_(\d{6})$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseRuleId(id: string): { lang: string; seq: number } | null {
  const m = RULE_ID_RE.exec(id);
  return m ? { lang: m[1], seq: Number(m[2]) } : null;
}

export function formatRuleId(lang: string, seq: number): string {
  if (!LANG_RE.test(lang)) throw new Error(`Noto'g'ri til kodi: ${lang}`);
  if (!Number.isInteger(seq) || seq < 1 || seq > 999_999) throw new Error(`Noto'g'ri tartib raqami: ${seq}`);
  return `gr_${lang}_${String(seq).padStart(6, "0")}`;
}

/** Berilgan til uchun keyingi bo'sh ID. `known` ichiga jonli va nafaqaga chiqarilgan (retired) ID'lar ham kiradi. */
export function nextRuleId(lang: string, known: Iterable<string>): string {
  let max = 0;
  for (const id of known) {
    const p = parseRuleId(id);
    if (p && p.lang === lang && p.seq > max) max = p.seq;
  }
  return formatRuleId(lang, max + 1);
}
