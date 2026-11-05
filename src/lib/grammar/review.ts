// Tekshiruv (review) yordamchilari. Faqat skript/test tomonida (node:crypto); Next bundle'iga kirmaydi.
//
// MUHIM: contentHash "kontent tekshirilgandan keyin o'zgardimi" degan savolga javob beradi, "kontent to'g'rimi" degan
// savolga EMAS. Grammatik to'g'rilikni faqat reviewer (metodist) tasdiqlaydi; dastur uni tekshira olmaydi.
import { createHash } from "node:crypto";
import { canonicalize } from "./registry.ts";

/**
 * Tekshiriladigan kontent xeshi: frontmatter (status va review'siz) + MDX tanasi.
 * `status` va `review` chiqarib tashlanadi, chunki reviewer aynan shu qiymatlarni yozadi.
 */
export function reviewContentHash(frontmatter: Record<string, unknown>, body: string): string {
  const { review: _review, status: _status, ...content } = frontmatter;
  void _review;
  void _status;
  const normalizedBody = body.replace(/\r\n?/g, "\n").trim();
  return createHash("sha256").update(canonicalize({ content, body: normalizedBody })).digest("hex").slice(0, 16);
}
