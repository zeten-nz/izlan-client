// Darsdan kelgan foydalanuvchini xavfsiz qaytarish: manzil URL'dan olinmaydi, faqat ikki ID'dan QURILADI.
// Shuning uchun open redirect mumkin emas: natija doim shu saytdagi aniq shablonli yo'l.
//   ?lesson=<uuid>&page=<sahifa-id>  → /student/lesson/<uuid>?page=<sahifa-id>   (o'quvchi)
//   ?studio=<uuid>                   → /teacher/lessons/<uuid>                   (ustoz, muharrir preview)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export type BackTarget = { href: string; label: string };
type Query = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined): string | null => (typeof v === "string" ? v : null);

export function parseBackTarget(q: Query): BackTarget | null {
  const studio = one(q.studio);
  if (studio) {
    return UUID_RE.test(studio) ? { href: `/teacher/lessons/${studio.toLowerCase()}`, label: "Muharrirga qaytish" } : null;
  }
  const lesson = one(q.lesson);
  if (!lesson || !UUID_RE.test(lesson)) return null;
  const page = one(q.page);
  const base = `/student/lesson/${lesson.toLowerCase()}`;
  return { href: page && PAGE_ID_RE.test(page) ? `${base}?page=${page}` : base, label: "Darsga qaytish" };
}
