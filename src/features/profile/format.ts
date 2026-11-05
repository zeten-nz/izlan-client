const TZ = "Asia/Tashkent";

/** Deterministik sana (SSR va brauzerda bir xil): YYYY-MM-DD, Asia/Tashkent bo'yicha. */
export function fmtDay(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** Deterministik sana va vaqt: DD.MM HH:MM */
export function fmtDayTime(iso: string | Date): string {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}.${g("month")} ${g("hour")}:${g("minute")}`;
}
