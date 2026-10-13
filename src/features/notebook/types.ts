/** Daftar API tiplari (server/src/notebook bilan mos). */

/** ok = ochish mumkin; locked = mavzu hali yopiq; unpublished/missing = dars endi mavjud emas */
export type SourceState = "none" | "ok" | "locked" | "unpublished" | "missing";

export type SourceView = {
  state: SourceState;
  lessonId: string | null;
  pageId: string | null;
  lessonTitle: string;
  topicId: string | null;
  topicTitle: string;
  directionId: string | null;
  directionTitle: string;
};

export type VocabItem = {
  id: string;
  term: string;
  meaning: string;
  example: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  source: SourceView;
};

export type NoteItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  source: SourceView;
};

export type SavedItem = {
  id: string;
  kind: "lesson" | "page";
  title: string;
  pageId: string | null;
  pageTitle: string;
  createdAt: string;
  /** Sahifa dars tahrirlanganda o'chirilgan/almashgan */
  pageMissing: boolean;
  source: SourceView;
};

export type LessonMistake = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  topic: { id: string; title: string; accessible: boolean };
  pageId: string;
  pageIndex: number;
  pageTitle: string;
  blockId: string;
  kind: "choice" | "fillblank";
  question: string;
  questionText: string;
  options?: Array<{ id: string; text: string; chosen: boolean; correct?: boolean }>;
  blanks?: Array<{ id: string; given: string; ok: boolean | null; answers?: string[] }>;
  explanation: string;
  tries: number;
  wrongTries: number;
  resolved: boolean;
  fromCurrentVersion: boolean;
  lastAt: string;
};

export type Paged<T> = { total: number; page: number; limit: number; items: T[] };

export type NotebookSummary = { vocabulary: number; notes: number; saved: number; mistakes: number };

/** Filtr/manba tanlash uchun: o'quvchining yo'nalishlari va unga ochiq mavzular. */
export type FilterOptions = {
  directions: Array<{ id: string; title: string }>;
  topics: Array<{ id: string; title: string; directionId: string }>;
};

export type SortKey = "new" | "old" | "az";
