/**
 * Tanlangan so'z/ibora joylashgan gapni topadi (Lug'atdagi "misol gap" uchun taklif).
 * Topilmasa bo'sh qaytadi — taxmin qilinmaydi. (server/src/notebook/notebook.util.ts bilan bir xil qoida.)
 */
export function sentenceAround(text: string, selected: string, max = 300): string {
  const t = text.replace(/\s+/g, " ").trim();
  const s = selected.replace(/\s+/g, " ").trim();
  if (!s) return "";
  const at = t.toLowerCase().indexOf(s.toLowerCase());
  if (at < 0) return "";
  const isEnd = (c: string) => c === "." || c === "!" || c === "?" || c === "…";
  let from = at;
  while (from > 0 && !isEnd(t[from - 1])) from--;
  let to = at + s.length;
  while (to < t.length && !isEnd(t[to - 1])) to++;
  const out = t.slice(from, to).trim();
  return out.length <= max ? out : "";
}
