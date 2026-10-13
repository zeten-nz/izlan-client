import { STAGE_H, STAGE_W, type Block, type BlockType, type LessonDoc, type Page } from "../types";

/** Hujjat ustida sof (immutable) amallar. Muharrir faqat shular orqali o'zgartiradi. */

export const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function newPage(): Page {
  return { id: uid("p"), title: "", gate: "free", blocks: [] };
}

/** Yangi blok: mavjudlarning tagiga joylanadi (sig'masa ozgina siljitib ustiga). */
export function newBlock(type: BlockType, existing: Block[]): Block {
  const b = draftBlock(type, existing);
  const bottom = existing.reduce((m, o) => Math.max(m, o.y + o.h), 0);
  const y = existing.length && bottom + 24 + b.h <= STAGE_H ? bottom + 24 : b.y;
  return { ...b, x: existing.length ? b.x : 120, y: existing.length ? y : 80 };
}

function draftBlock(type: BlockType, existing: Block[]): Block {
  const n = existing.length % 8;
  const base = { id: uid("b"), x: 200 + n * 24, y: 140 + n * 24, z: existing.reduce((m, b) => Math.max(m, b.z + 1), 0) };
  switch (type) {
    case "heading":
      return { ...base, type, w: 1000, h: 110, text: "Yangi sarlavha", level: 1, align: "left" };
    case "text":
      return { ...base, type, w: 800, h: 240, text: "Matn yozing…", align: "left" };
    case "callout":
      return { ...base, type, w: 800, h: 190, text: "Muhim tushuncha", tone: "warning" };
    case "image":
      return { ...base, type, w: 600, h: 400, assetId: null, alt: "", fit: "contain" };
    case "audio":
      return { ...base, type, w: 800, h: 150, assetId: null, caption: "", transcript: "" };
    case "choice": {
      const a = uid("o");
      return {
        ...base,
        type,
        w: 900,
        h: 380,
        question: "Savol matni?",
        options: [
          { id: a, text: "To'g'ri javob" },
          { id: uid("o"), text: "Noto'g'ri javob" },
        ],
        correctIds: [a],
        multiple: false,
        explanation: "",
      };
    }
    case "fillblank":
      return { ...base, type, w: 1000, h: 220, template: "I [[1]] a student.", blanks: [{ id: "1", answers: ["am"], caseSensitive: false }], explanation: "" };
  }
}

export function fitBlock<T extends Block>(b: T): T {
  const w = clamp(b.w, 40, STAGE_W);
  const h = clamp(b.h, 40, STAGE_H);
  return { ...b, w, h, x: clamp(b.x, 0, STAGE_W - w), y: clamp(b.y, 0, STAGE_H - h) };
}

export const mapPage = (doc: LessonDoc, pageId: string, f: (p: Page) => Page): LessonDoc => ({
  ...doc,
  pages: doc.pages.map((p) => (p.id === pageId ? f(p) : p)),
});

export const mapBlock = (doc: LessonDoc, pageId: string, blockId: string, f: (b: Block) => Block): LessonDoc =>
  mapPage(doc, pageId, (p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === blockId ? f(b) : b)) }));

export function removeBlock(doc: LessonDoc, pageId: string, blockId: string): LessonDoc {
  return mapPage(doc, pageId, (p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }));
}

export function cloneBlock(b: Block): Block {
  const copy = structuredClone(b) as Block;
  copy.id = uid("b");
  if (copy.type === "choice") {
    const map = new Map(copy.options.map((o) => [o.id, uid("o")]));
    copy.options = copy.options.map((o) => ({ ...o, id: map.get(o.id)! }));
    copy.correctIds = copy.correctIds.map((c) => map.get(c)!).filter(Boolean);
  }
  return copy;
}

export function duplicateBlock(doc: LessonDoc, pageId: string, blockId: string): { doc: LessonDoc; id: string | null } {
  const page = doc.pages.find((p) => p.id === pageId);
  const src = page?.blocks.find((b) => b.id === blockId);
  if (!page || !src) return { doc, id: null };
  const copy = fitBlock({ ...cloneBlock(src), x: src.x + 32, y: src.y + 32, z: page.blocks.reduce((m, b) => Math.max(m, b.z + 1), 0) });
  return { doc: mapPage(doc, pageId, (p) => ({ ...p, blocks: [...p.blocks, copy] })), id: copy.id };
}

export function duplicatePage(doc: LessonDoc, pageId: string): { doc: LessonDoc; id: string | null } {
  const i = doc.pages.findIndex((p) => p.id === pageId);
  if (i < 0) return { doc, id: null };
  const src = doc.pages[i];
  const copy: Page = { ...structuredClone(src), id: uid("p"), blocks: src.blocks.map(cloneBlock) };
  const pages = [...doc.pages.slice(0, i + 1), copy, ...doc.pages.slice(i + 1)];
  return { doc: { ...doc, pages }, id: copy.id };
}

/** Qatlam tartibi: blok z qiymatlarini 0..n-1 ga qayta tartiblab, tanlanganini oldinga/orqaga suradi. */
export function reorderZ(doc: LessonDoc, pageId: string, blockId: string, dir: "front" | "back" | "up" | "down"): LessonDoc {
  return mapPage(doc, pageId, (p) => {
    const order = [...p.blocks].sort((a, b) => a.z - b.z).map((b) => b.id);
    const i = order.indexOf(blockId);
    if (i < 0) return p;
    order.splice(i, 1);
    const j = dir === "front" ? order.length : dir === "back" ? 0 : dir === "up" ? Math.min(order.length, i + 1) : Math.max(0, i - 1);
    order.splice(j, 0, blockId);
    return { ...p, blocks: p.blocks.map((b) => ({ ...b, z: order.indexOf(b.id) })) };
  });
}
