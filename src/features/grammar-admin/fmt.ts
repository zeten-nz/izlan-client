// Server va brauzerda BIR XIL natija beradi (aniq locale + vaqt zonasi) — hydration nomuvofiqligi bo'lmasligi uchun.
const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${f.format(d).replace(",", "")} (Toshkent)`;
}
