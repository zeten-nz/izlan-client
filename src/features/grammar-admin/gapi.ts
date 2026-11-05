// Grammatika boshqaruvi uchun brauzer tomoni API yordamchisi. 422 javobdagi `issues` ro'yxatini ham qaytaradi.
export type Issue = { path: string; message: string };
export type GResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string; issues: Issue[]; body: Record<string, unknown> | null };

export async function gcall<T = unknown>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<GResult<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method,
      cache: "no-store",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok) return { ok: true, data: json as T };
    const issues = Array.isArray(json?.issues) ? (json!.issues as Issue[]) : Array.isArray(json?.errors) ? (json!.errors as Issue[]) : [];
    const message = typeof json?.message === "string" ? json.message : Array.isArray(json?.message) ? String((json.message as unknown[])[0]) : "Xatolik yuz berdi. Qayta urinib ko'ring";
    return { ok: false, status: res.status, message, issues, body: json };
  } catch {
    return { ok: false, status: 0, message: "Server bilan aloqa yo'q. Internetni tekshiring", issues: [], body: null };
  }
}

export type RevisionView = {
  id: string;
  explanationLang: string;
  revisionNo: number;
  status: "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
  rev: number;
  content: Record<string, unknown>;
  contentHash: string;
  provenance: string;
  authorId: string | null;
  authorLabel: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  selfApproved: boolean;
  reviewNote: string | null;
  updatedAt: string;
  canEdit: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
};

export type RuleView = {
  id: string;
  lang: string;
  slug: string;
  category: string;
  level: { system: string; value: string | null; confirmed: boolean } | null;
  state: "OPEN" | "RETIRED";
  replacedById: string | null;
  retiredReason: string | null;
  hidden: boolean;
  createdById: string | null;
  createdLabel: string | null;
  aliases: string[];
  canDelete: boolean;
  revisions: RevisionView[];
};

export type RuleRow = {
  id: string;
  lang: string;
  slug: string;
  category: string;
  level: { system: string; value: string | null; confirmed: boolean } | null;
  state: "OPEN" | "RETIRED";
  hidden: boolean;
  mine: boolean;
  updatedAt: string;
  createdLabel: string | null;
  revisions: { id: string; explanationLang: string; revisionNo: number; status: RevisionView["status"]; title: string; authorLabel: string | null; provenance: string; selfApproved: boolean; canEdit: boolean; updatedAt: string }[];
};

export type LanguageCfg = {
  code: string;
  name: string;
  enabled: boolean;
  levelSystem: string;
  scripts: string[];
  blocks: string[];
  categories: { id: string; title: Record<string, string> }[];
};

/** Kategoriya ID → o'zbekcha nom (barcha tillar bo'yicha; bir xil ID bo'lsa birinchisi). */
export function categoryTitles(languages: LanguageCfg[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of languages) for (const c of l.categories) out[c.id] ??= c.title.uz ?? c.id;
  return out;
}

export const STATUS_LABEL: Record<RevisionView["status"], string> = {
  DRAFT: "Qoralama",
  IN_REVIEW: "Tekshiruvda",
  CHANGES_REQUESTED: "Tuzatish kerak",
  REJECTED: "Rad etilgan",
  APPROVED: "Tasdiqlangan",
};

export const LEVELS: Record<string, string[]> = {
  cefr: ["A1", "A2", "B1", "B2", "C1", "C2"],
  jlpt: ["N5", "N4", "N3", "N2", "N1"],
};
