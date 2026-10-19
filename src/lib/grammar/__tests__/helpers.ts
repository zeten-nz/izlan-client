// Test yordamchilari: governance talablariga mos "approved" kontent yaratish (faqat test/fixture uchun).
import type { RawFile } from "../corpus.ts";
import { reviewContentHash } from "../review.ts";

export const TEST_REVIEWER = "test-reviewer";
export const TEST_AUTHOR = "test-author";

/** reviewers.json (test): bitta reviewer, uchala til uchun. */
export const REVIEWERS_RAW: RawFile = {
  path: "reviewers.json",
  text: JSON.stringify({
    schemaVersion: 1,
    reviewers: [{ id: TEST_REVIEWER, name: "Test Reviewer", role: "methodist", languages: ["en", "ru", "ja"], addedAt: "2026-01-01", appointedBy: "test" }],
  }),
};

/**
 * Frontmatter'ni tekshiruvdan o'tgan (approved) holatga keltiradi: author, manba, review va to'g'ri contentHash.
 * `body` — MDX tanasi (frontmatter'dan keyingi matn).
 */
export function approved(data: Record<string, unknown>, body = "Matn.\n", over: { reviewer?: string; author?: string; checks?: Record<string, boolean>; hash?: string } = {}) {
  const base: Record<string, unknown> = {
    ...data,
    status: "approved",
    author: over.author ?? TEST_AUTHOR,
    sources: (data.sources as unknown[] | undefined) ?? [{ title: "Original (test)", license: "original" }],
  };
  delete base.review;
  const hash = reviewContentHash(base, body);
  return {
    ...base,
    review: {
      reviewedBy: over.reviewer ?? TEST_REVIEWER,
      reviewedAt: "2026-01-02",
      reviewedRevision: base.revision,
      contentHash: over.hash ?? hash,
      checks: over.checks ?? { grammar: true, examples: true, translations: true, level: true },
    },
  };
}
