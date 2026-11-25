/** 100000 → "100 000" (so'm, butun son). */
export function formatUzs(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
