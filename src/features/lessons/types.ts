/** Dars hujjati (server/src/lessons/doc.schema.ts bilan mos). Sahifa = 1600x900 mantiqiy sahna. */
export const STAGE_W = 1600;
export const STAGE_H = 900;
export const DOC_SCHEMA_VERSION = 1;

export type Gate = "free" | "answered" | "correct";
export type Align = "left" | "center" | "right";

type Frame = { id: string; x: number; y: number; w: number; h: number; z: number };

export type HeadingBlock = Frame & { type: "heading"; text: string; level: 1 | 2 | 3; align: Align };
export type TextBlock = Frame & { type: "text"; text: string; align: Align };
export type CalloutBlock = Frame & { type: "callout"; text: string; tone: "info" | "warning" | "success" };
export type ImageBlock = Frame & { type: "image"; assetId: string | null; alt: string; fit: "contain" | "cover" };
export type AudioBlock = Frame & { type: "audio"; assetId: string | null; caption: string; transcript: string };
export type ChoiceOption = { id: string; text: string };
export type ChoiceBlock = Frame & {
  type: "choice";
  question: string;
  options: ChoiceOption[];
  correctIds: string[];
  multiple: boolean;
  explanation: string;
};
export type Blank = { id: string; answers: string[]; caseSensitive: boolean };
export type FillBlankBlock = Frame & { type: "fillblank"; template: string; blanks: Blank[]; explanation: string };

export type Block = HeadingBlock | TextBlock | CalloutBlock | ImageBlock | AudioBlock | ChoiceBlock | FillBlankBlock;
export type BlockType = Block["type"];
export type Page = { id: string; title: string; gate: Gate; blocks: Block[] };
export type LessonDoc = { schemaVersion: 1; pages: Page[] };

export const isInteractive = (b: { type: string }) => b.type === "choice" || b.type === "fillblank";

/** O'quvchi ko'rinishi: to'g'ri javoblar yo'q. */
export type PlayerBlock =
  | Exclude<Block, ChoiceBlock | FillBlankBlock>
  | Omit<ChoiceBlock, "correctIds" | "explanation">
  | (Omit<FillBlankBlock, "blanks" | "explanation"> & { blanks: { id: string }[] });
export type PlayerPage = Omit<Page, "blocks"> & { blocks: PlayerBlock[] };

export type AnswerResult = { correct: boolean; blanks?: Record<string, boolean>; explanation: string };
export type AttemptView = { correct: boolean; everCorrect: boolean; tries: number; response?: unknown };

export type PlayerView = {
  lesson: { id: string; title: string; topicId: string };
  totalPages: number;
  unlocked: number;
  allDone: boolean;
  completed: boolean;
  pages: PlayerPage[];
  attempts: Record<string, AttemptView>;
  /** Dars istalgan versiyada tugatilgan, hozir nashrda qayta ko'rilmoqda */
  review?: boolean;
  /** Davom ettirish uchun oxirgi tasdiqlangan sahifa (progress emas) */
  lastPageIndex?: number | null;
  /** Haqiqatan ochib ko'rilgan sahifalar */
  visitedPageIds?: string[];
  progress?: { review: { total: number; seen: number; pct: number }; required: { total: number; done: number } };
};

export const assetUrl = (id: string) => `/api/assets/${id}`;

export const BLANK_RE = /\[\[([A-Za-z0-9_-]{1,40})\]\]/g;
