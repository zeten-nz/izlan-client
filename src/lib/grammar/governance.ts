// Tasdiqlash (approval) holati hisoboti: reviewer uchun "nima yetishmayapti" ro'yxati.
// Bu HISOBOT (yordam). Majburiy tekshiruv corpus.ts + schema.ts'da; bu funksiya ularni takrorlamaydi, balki
// jarayonni ko'rsatadi. Metadata to'liqligi grammatik to'g'rilikni anglatmaydi.
import type { Rule, Translation } from "./corpus.ts";
import { REVIEW_CHECKS, type ReviewersFile } from "./schema.ts";

export type Readiness = {
  id: string;
  lang: string;
  slug: string;
  explanationLang: string;
  status: string;
  revision: number;
  author: string | null;
  reviewedBy: string | null;
  contentHash: string;
  /** Approved bo'lishi uchun yetishmayotgan yoki mos kelmayotgan bandlar. */
  blockers: string[];
};

export function readiness(rule: Rule, t: Translation, reviewers: ReviewersFile | null): Readiness {
  const d = t.data;
  const rev = d.review as Record<string, unknown> | undefined;
  const checks = (rev?.checks ?? {}) as Record<string, unknown>;
  const blockers: string[] = [];

  if (!d.author) blockers.push("muallif (author) ko'rsatilmagan");
  if (!d.sources?.length) blockers.push("manba (sources) yo'q");
  else if (d.sources.some((s) => !s.license)) blockers.push("manbalardan birida litsenziya yo'q");
  if (d.examples.length < 2) blockers.push("kamida 2 ta misol kerak");

  const reviewerId = typeof rev?.reviewedBy === "string" ? rev.reviewedBy : null;
  const reviewer = reviewerId ? reviewers?.reviewers.find((r) => r.id === reviewerId) : undefined;
  if (!reviewerId) blockers.push("reviewer (review.reviewedBy) belgilanmagan");
  else if (!reviewer) blockers.push(`reviewer '${reviewerId}' reviewers.json'da yo'q`);
  else if (!reviewer.languages.includes(rule.meta.lang)) blockers.push(`reviewer '${reviewerId}' ${rule.meta.lang} tili uchun tayinlanmagan`);
  if (d.author && reviewerId && d.author === reviewerId) blockers.push("muallif va reviewer bir xil shaxs");

  for (const k of REVIEW_CHECKS) if (checks[k] !== true) blockers.push(`reviewer '${k}' bandini tasdiqlamagan`);
  if (rev?.reviewedRevision !== d.revision) blockers.push(`tekshirilgan tahrir (${String(rev?.reviewedRevision ?? "yo'q")}) ≠ joriy tahrir (${d.revision})`);
  if (rev?.contentHash !== t.contentHash) blockers.push(`contentHash mos emas (joriy: ${t.contentHash})`);

  return {
    id: rule.meta.id,
    lang: rule.meta.lang,
    slug: rule.meta.slug,
    explanationLang: t.lang,
    status: d.status,
    revision: d.revision,
    author: d.author ?? null,
    reviewedBy: reviewerId,
    contentHash: t.contentHash,
    blockers,
  };
}
