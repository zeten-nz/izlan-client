import type { Metadata } from "next";
import { Suspense } from "react";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { categoryTitles, type LanguageCfg, type RuleRow } from "@/features/grammar-admin/gapi";
import { GrammarLoading } from "@/features/grammar-admin/RulePage";
import { RuleList } from "@/features/grammar-admin/RuleList";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Grammatika qoidalarim", robots: { index: false } };

async function TeacherGrammar() {
  await requireRole("TEACHER");
  const [rules, languages] = await Promise.all([
    apiGet<RuleRow[]>("/staff/grammar/manage/rules"),
    apiGet<LanguageCfg[]>("/staff/grammar/languages"),
  ]);
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-10">
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">Ustoz</span>
      <h1 className="display-cond mt-4 text-[clamp(34px,6vw,60px)]">Grammatika qoidalari</h1>
      <p className="mt-3 max-w-2xl text-lg leading-snug text-ink/80">
        Yangi qoida yozing va tekshiruvga yuboring. Tasdiqlangan qoida o&apos;quvchilarga faqat keyingi release&apos;dan keyin ko&apos;rinadi. Boshqa ustozlarning qoidalarini faqat o&apos;qishingiz mumkin.
      </p>
      <ButtonLink href="/teacher/grammar/new" className="mt-6">
        Yangi qoida
        <Arrow />
      </ButtonLink>
      <div className="mt-8">
        <RuleList rules={rules} base="/teacher/grammar" role="TEACHER" categories={categoryTitles(languages)} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<GrammarLoading />}>
      <TeacherGrammar />
    </Suspense>
  );
}
