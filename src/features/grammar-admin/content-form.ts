// Muharrir forma holati ↔ server kontenti (GrammarRevision.content). Sof funksiyalar (testlanadi).
// Server — yagona hokim: bu yerdagi konvertatsiya faqat qulaylik; yakuniy tekshiruv serverda.

export type Ruby = { base: string; reading?: string }[];
export type ExampleF = { text: string; translation: string; note: string; reading: string; stressed: string; ruby: string };
export type SourceF = {
  title: string;
  url: string;
  author: string;
  license: string;
  attribution: string;
  shareAlike: boolean;
  review: "" | "UNRESOLVED" | "ALLOWED" | "BLOCKED";
  reviewNote: string;
};
export type BlockF =
  | { kind: "table"; caption: string; headers: string; rows: string }
  | { kind: "conjugation"; caption: string; forms: string }
  | { kind: "declension"; caption: string; word: string; gender: "" | "m" | "f" | "n"; rows: string };

export type FormState = {
  title: string;
  summary: string;
  body: string;
  keywords: string;
  related: string;
  formulas: { label: string; pattern: string; note: string }[];
  examples: ExampleF[];
  exceptions: { title: string; body: string }[];
  commonMistakes: { wrong: string; right: string; explanation: string }[];
  sources: SourceF[];
  blocks: BlockF[];
};

export const emptyForm = (title = ""): FormState => ({
  title,
  summary: "",
  body: "",
  keywords: "",
  related: "",
  formulas: [],
  examples: [],
  exceptions: [],
  commonMistakes: [],
  sources: [],
  blocks: [],
});

const opt = (s: string) => (s.trim() ? s.trim() : undefined);
const split = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);
const cells = (line: string) => line.split("|").map((x) => x.trim());

/** "漢:かん 字:じ を" → [{base:"漢",reading:"かん"},{base:"字",reading:"じ"},{base:"を"}] */
export function parseRuby(s: string): Ruby | undefined {
  const parts = split(s, /\s+/);
  if (!parts.length) return undefined;
  return parts.map((p) => {
    const i = p.indexOf(":");
    return i < 0 ? { base: p } : { base: p.slice(0, i), reading: p.slice(i + 1) || undefined };
  });
}
export const rubyToString = (r?: Ruby) => (r ?? []).map((s) => (s.reading ? `${s.base}:${s.reading}` : s.base)).join(" ");

type Json = Record<string, unknown>;

export function toContent(f: FormState): Json {
  const c: Json = {
    title: f.title.trim(),
    summary: f.summary.trim(),
    body: f.body,
    keywords: split(f.keywords, /[,\n]/),
    related: split(f.related, /[\s,]+/),
    formulas: f.formulas.map((x) => ({ label: x.label.trim(), pattern: x.pattern.trim(), ...(opt(x.note) ? { note: opt(x.note) } : {}) })),
    examples: f.examples.map((e) => ({
      text: e.text.trim(),
      translation: e.translation.trim(),
      ...(opt(e.note) ? { note: opt(e.note) } : {}),
      ...(opt(e.reading) ? { reading: opt(e.reading) } : {}),
      ...(opt(e.stressed) ? { stressed: opt(e.stressed) } : {}),
      ...(parseRuby(e.ruby) ? { ruby: parseRuby(e.ruby) } : {}),
    })),
    exceptions: f.exceptions.map((x) => ({ title: x.title.trim(), body: x.body.trim() })),
    commonMistakes: f.commonMistakes.map((x) => ({ wrong: x.wrong.trim(), right: x.right.trim(), explanation: x.explanation.trim() })),
    sources: f.sources.map((s) => ({
      title: s.title.trim(),
      ...(opt(s.url) ? { url: opt(s.url) } : {}),
      ...(opt(s.author) ? { author: opt(s.author) } : {}),
      ...(opt(s.license) ? { license: opt(s.license) } : {}),
      ...(opt(s.attribution) ? { attribution: opt(s.attribution) } : {}),
      shareAlike: s.shareAlike,
      ...(s.review ? { licenseReview: { status: s.review, ...(opt(s.reviewNote) ? { note: opt(s.reviewNote) } : {}) } } : {}),
    })),
    blocks: f.blocks.map((b): Json => {
      if (b.kind === "table") {
        return { kind: "table", ...(opt(b.caption) ? { caption: opt(b.caption) } : {}), headers: cells(b.headers.replace(/\n/g, "|")).filter(Boolean), rows: split(b.rows, /\n/).map((l) => cells(l)) };
      }
      if (b.kind === "conjugation") {
        return {
          kind: "conjugation",
          ...(opt(b.caption) ? { caption: opt(b.caption) } : {}),
          forms: split(b.forms, /\n/).map((l) => {
            const [label, value, reading] = cells(l);
            return { label, value, ...(reading ? { reading } : {}) };
          }),
        };
      }
      return {
        kind: "declension",
        ...(opt(b.caption) ? { caption: opt(b.caption) } : {}),
        ...(opt(b.word) ? { word: opt(b.word) } : {}),
        ...(b.gender ? { gender: b.gender } : {}),
        rows: split(b.rows, /\n/).map((l) => {
          const [kase, caseId, singular, plural, note] = cells(l);
          return { case: kase, ...(caseId ? { caseId } : {}), singular, plural, ...(note ? { note } : {}) };
        }),
      };
    }),
  };
  return c;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);

export function fromContent(c: Json | null | undefined): FormState {
  if (!c) return emptyForm();
  return {
    title: str(c.title),
    summary: str(c.summary),
    body: str(c.body),
    keywords: (Array.isArray(c.keywords) ? (c.keywords as string[]) : []).join(", "),
    related: (Array.isArray(c.related) ? (c.related as string[]) : []).join(", "),
    formulas: arr(c.formulas).map((x) => ({ label: str(x.label), pattern: str(x.pattern), note: str(x.note) })),
    examples: arr(c.examples).map((e) => ({
      text: str(e.text),
      translation: str(e.translation),
      note: str(e.note),
      reading: str(e.reading),
      stressed: str(e.stressed),
      ruby: rubyToString(e.ruby as Ruby | undefined),
    })),
    exceptions: arr(c.exceptions).map((x) => ({ title: str(x.title), body: str(x.body) })),
    commonMistakes: arr(c.commonMistakes).map((x) => ({ wrong: str(x.wrong), right: str(x.right), explanation: str(x.explanation) })),
    sources: arr(c.sources).map((s) => {
      const lr = (s.licenseReview ?? {}) as Json;
      return {
        title: str(s.title),
        url: str(s.url),
        author: str(s.author),
        license: str(s.license),
        attribution: str(s.attribution),
        shareAlike: s.shareAlike === true,
        review: (str(lr.status) as SourceF["review"]) || "",
        reviewNote: str(lr.note),
      };
    }),
    blocks: arr(c.blocks).map((b): BlockF => {
      if (b.kind === "table") {
        return { kind: "table", caption: str(b.caption), headers: (b.headers as string[] | undefined)?.join(" | ") ?? "", rows: arr(b.rows as unknown).length ? (b.rows as string[][]).map((r) => r.join(" | ")).join("\n") : "" };
      }
      if (b.kind === "conjugation") {
        return { kind: "conjugation", caption: str(b.caption), forms: arr(b.forms).map((f) => [str(f.label), str(f.value), str(f.reading)].join(" | ").replace(/ \| $/, "")).join("\n") };
      }
      return {
        kind: "declension",
        caption: str(b.caption),
        word: str(b.word),
        gender: (str(b.gender) as "" | "m" | "f" | "n") || "",
        rows: arr(b.rows).map((r) => [str(r.case), str(r.caseId), str(r.singular), str(r.plural), str(r.note)].join(" | ")).join("\n"),
      };
    }),
  };
}

export const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’ʻ`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
