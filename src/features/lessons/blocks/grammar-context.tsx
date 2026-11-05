"use client";

import { createContext, useContext } from "react";
import { grammarHref } from "@/config/routes";

/** Muharrirda ustozga ko'rsatiladigan qoida (server reyestridan; faqat approved va faol til). */
export type GrammarRuleInfo = {
  id: string;
  lang: string;
  langName: string;
  title: string;
  category: string;
  level?: { system: string; value: string; confirmed: boolean };
};

export type GrammarRulesState = {
  /** null = hali yuklanmagan yoki yuklab bo'lmadi */
  rules: GrammarRuleInfo[] | null;
  serverVersion: string | null;
  error: string | null;
};

export const GrammarRulesContext = createContext<GrammarRulesState>({ rules: null, serverVersion: null, error: null });
export const useGrammarRules = () => useContext(GrammarRulesContext);

/** Havola qayerdan ochilmoqda: qaytish manzili shundan quriladi (ixtiyoriy URL emas, faqat shu ikki shakl). */
export type LessonLocation = { lessonId: string; pageId: string; surface: "student" | "preview" };
export const LessonLocationContext = createContext<LessonLocation | null>(null);
export const useLessonLocation = () => useContext(LessonLocationContext);

/**
 * Qoida sahifasiga ichki havola. `lang` va `ruleId` serverdan (o'quvchi ko'rinishi) keladi.
 * Doimiy ID bilan: slug o'zgarsa ham client routing uni joriy slug'ga yo'naltiradi.
 */
export function grammarOpenHref(rule: { id: string; lang: string }, loc: LessonLocation | null): string {
  const base = grammarHref(rule.lang, rule.id);
  if (!loc) return base;
  const q = new URLSearchParams(loc.surface === "preview" ? { studio: loc.lessonId } : { lesson: loc.lessonId, page: loc.pageId });
  return `${base}?${q.toString()}`;
}
