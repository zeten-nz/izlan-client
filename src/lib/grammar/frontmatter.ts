// MDX fayl: `---` oralig'ida JSON ob'ekt (JSON — YAML'ning to'g'ri qism to'plami, shuning uchun remark-frontmatter
// bilan keyin ham ishlaydi), undan keyin MDX tanasi. Qo'shimcha dependency talab qilinmaydi.

export type FrontmatterResult =
  | { ok: true; data: unknown; body: string; bodyStartLine: number }
  | { ok: false; error: string };

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function parseFrontmatter(source: string): FrontmatterResult {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const m = FENCE.exec(text);
  if (!m) return { ok: false, error: "fayl '---' bilan boshlanuvchi frontmatter bloki bilan boshlanishi kerak" };
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch (e) {
    return { ok: false, error: `frontmatter yaroqli JSON emas: ${(e as Error).message}` };
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "frontmatter JSON ob'ekt bo'lishi kerak" };
  }
  const bodyStartLine = m[0].split("\n").length;
  return { ok: true, data, body: text.slice(m[0].length), bodyStartLine };
}
