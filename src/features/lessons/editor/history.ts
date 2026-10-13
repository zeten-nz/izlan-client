import type { LessonDoc } from "../types";

const MAX_HISTORY = 100;
/** Shu oraliqda (ms) bir xil `key` bilan kelgan o'zgarishlar bitta undo qadamiga birlashadi (masalan, matn terish). */
const COALESCE_MS = 900;

export type HistoryState = {
  doc: LessonDoc;
  past: LessonDoc[];
  future: LessonDoc[];
  lastKey: string | null;
  lastAt: number;
};

export type HistoryAction =
  | { type: "commit"; doc: LessonDoc; key?: string; now: number }
  | { type: "undo" }
  | { type: "redo" };

export const initHistory = (doc: LessonDoc): HistoryState => ({ doc, past: [], future: [], lastKey: null, lastAt: 0 });

export function historyReducer(s: HistoryState, a: HistoryAction): HistoryState {
  switch (a.type) {
    case "commit": {
      if (a.doc === s.doc) return s;
      const coalesce = a.key !== undefined && a.key === s.lastKey && a.now - s.lastAt < COALESCE_MS;
      return {
        doc: a.doc,
        past: coalesce ? s.past : [...s.past, s.doc].slice(-MAX_HISTORY),
        future: [],
        lastKey: a.key ?? null,
        lastAt: a.now,
      };
    }
    case "undo": {
      if (!s.past.length) return s;
      return { doc: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.doc, ...s.future], lastKey: null, lastAt: 0 };
    }
    case "redo": {
      if (!s.future.length) return s;
      return { doc: s.future[0], past: [...s.past, s.doc], future: s.future.slice(1), lastKey: null, lastAt: 0 };
    }
  }
}
