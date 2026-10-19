import Link from "next/link";
import { notFound } from "next/navigation";
import { apiGet } from "@/server/api";
import type { LanguageCfg, RuleView } from "./gapi";
import { ReviewPanel } from "./ReviewPanel";
import { RuleEditor } from "./RuleEditor";

export function GrammarLoading() {
  return <div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>;
}

/** Bitta qoida sahifasi (Teacher/Admin umumiy). Server har bir amalni qayta tekshiradi; bu yerda faqat ko'rsatish. */
export async function RulePage({ ruleId, rev, role, base }: { ruleId: string; rev?: string; role: "TEACHER" | "ADMIN"; base: string }) {
  const [rule, languages] = await Promise.all([
    apiGet<RuleView>(`/staff/grammar/manage/rules/${encodeURIComponent(ruleId)}`),
    apiGet<LanguageCfg[]>("/staff/grammar/languages"),
  ]);
  const lang = languages.find((l) => l.code === rule.lang);
  const revision = (rev && rule.revisions.find((r) => r.id === rev)) || rule.revisions.find((r) => r.explanationLang === "uz");
  if (!lang || !revision) notFound();
  const title = (revision.content.title as string) || rule.slug;
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-8 sm:py-10">
      <Link href={base} className="label underline underline-offset-4">
        ← Qoidalar
      </Link>
      <h1 className="display-cond mt-3 text-[clamp(30px,5vw,52px)]">{title}</h1>
      <div className={role === "ADMIN" ? "mt-6 grid gap-8 xl:grid-cols-[1fr_380px]" : "mt-6"}>
        <RuleEditor key={`${revision.id}:${revision.rev}:${revision.status}`} rule={rule} revision={revision} lang={lang} role={role} base={base} />
        {role === "ADMIN" && <ReviewPanel key={`${revision.id}:${revision.status}:${rule.hidden}`} rule={rule} revision={revision} />}
      </div>
    </div>
  );
}
