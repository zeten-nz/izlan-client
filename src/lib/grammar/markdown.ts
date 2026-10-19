// MDX tanasining XAVFSIZ qism to'plami uchun parser. Hech narsa bajarilmaydi va kompilyatsiya qilinmaydi:
// matn → oddiy ma'lumot daraxti (AST) → React elementlari. JS ifodalar, import, xom HTML qo'llab-quvvatlanmaydi
// (ular mdx-lint.ts orqali build'dayoq rad etiladi; bu yerda esa shunchaki oddiy matn sifatida chiqadi).

export type Tone = "info" | "warning" | "tip";
export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };
export type Block =
  | { t: "h2" | "h3"; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "callout"; tone: Tone; c: Block[] }
  | { t: "code"; v: string };

/** Faqat ichki yo'l, https va mailto. Boshqa hamma sxema (javascript:, data:, ...) rad etiladi. */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^\/(?![/\\])/.test(h)) return h; // "//host" va "/\host" (brauzer "\"ni "/" deb o'qiydi) rad etiladi
  if (/^https:\/\/[^\s]+$/i.test(h)) return h;
  if (/^mailto:[^\s]+$/i.test(h)) return h;
  return null;
}

// Guruhlar: 1 escape (\x), 2 qalin, 3 kod, 4-5 havola (yorliq, manzil), 6-7 kursiv (oldingi belgi, matn).
// Escape birinchi: "\*" kursiv/qalin sifatida talqin qilinmasligi uchun.
// Kvantifikatorlar chegaralangan: yomon niyatli/xato kirishda kvadratik vaqt (ReDoS) bo'lmasligi uchun.
const INLINE = /\\([\\*`\[\]{}])|\*\*(.{1,500}?)\*\*|`([^`]{1,500})`|\[([^\]]{1,300})\]\(([^)\s]{1,500})\)|(^|[^*\w])\*([^*\s][^*]{0,300}?)\*(?![*\w])/g;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const text = (v: string) => {
    if (v) out.push({ t: "text", v });
  };
  let last = 0;
  for (const m of src.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) text(src.slice(last, i));
    if (m[1] !== undefined) text(m[1]);
    else if (m[2] !== undefined) out.push({ t: "strong", c: parseInline(m[2]) });
    else if (m[3] !== undefined) out.push({ t: "code", v: m[3] });
    else if (m[4] !== undefined) {
      const href = safeHref(m[5]);
      if (href) out.push({ t: "link", href, c: parseInline(m[4]) });
      else text(m[4]); // xavfli havola: faqat yorliq matni qoladi
    } else {
      text(m[6]); // *...* oldidagi belgi
      out.push({ t: "em", c: parseInline(m[7]) });
    }
    last = i + m[0].length;
  }
  if (last < src.length) text(src.slice(last));
  return out;
}

const CALLOUT_OPEN = /^<Callout(?:\s+tone="(info|warning|tip)")?\s*>(.*)$/;

export function parseMarkdown(src: string, allowCallout = true): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: Inline[][] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  const flush = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      flush();
      const fence = trimmed.slice(0, 3);
      const buf: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence); i++) buf.push(lines[i]);
      blocks.push({ t: "code", v: buf.join("\n") });
      continue;
    }

    const open = allowCallout ? CALLOUT_OPEN.exec(trimmed) : null;
    if (open) {
      flush();
      const tone = (open[1] as Tone | undefined) ?? "info";
      let rest = open[2];
      const inner: string[] = [];
      const closeSame = rest.indexOf("</Callout>");
      if (closeSame >= 0) {
        inner.push(rest.slice(0, closeSame));
      } else {
        if (rest.trim()) inner.push(rest);
        for (i++; i < lines.length; i++) {
          const c = lines[i].indexOf("</Callout>");
          if (c >= 0) {
            inner.push(lines[i].slice(0, c));
            break;
          }
          inner.push(lines[i]);
        }
      }
      blocks.push({ t: "callout", tone, c: parseMarkdown(inner.join("\n"), false) });
      rest = "";
      continue;
    }

    if (!trimmed) {
      flush();
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (h) {
      flush();
      blocks.push({ t: h[1].length >= 3 ? "h3" : "h2", c: parseInline(h[2]) });
      continue;
    }
    const li = /^(?:([-*])|(\d+)\.)\s+(.+)$/.exec(trimmed);
    if (li) {
      flushPara();
      const kind = li[1] ? "ul" : "ol";
      if (list && list.t !== kind) flushList();
      if (!list) list = { t: kind, items: [] };
      list.items.push(parseInline(li[3]));
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flush();
  return blocks;
}
