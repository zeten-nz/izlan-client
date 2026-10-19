import type { Metadata } from "next";
import { Suspense } from "react";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import type { RuleRow } from "@/features/grammar-admin/gapi";
import { GrammarLoading } from "@/features/grammar-admin/RulePage";
import { RuleList } from "@/features/grammar-admin/RuleList";
import { AdminNav } from "@/features/staff/AdminNav";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: grammatika", robots: { index: false } };

async function Dashboard() {
  await requireRole("ADMIN");
  const rules = await apiGet<RuleRow[]>("/staff/grammar/manage/rules");
  const c = { total: rules.length, inReview: 0, draft: 0, approved: 0, changes: 0, hidden: 0 };
  for (const r of rules) {
    const s = r.revisions[0]?.status;
    if (s === "IN_REVIEW") c.inReview++;
    if (s === "DRAFT") c.draft++;
    if (s === "APPROVED") c.approved++;
    if (s === "CHANGES_REQUESTED") c.changes++;
    if (r.hidden) c.hidden++;
  }
  const stats: [string, number][] = [
    ["Jami", c.total],
    ["Tekshiruvda", c.inReview],
    ["Qoralama", c.draft],
    ["Tuzatish kerak", c.changes],
    ["Tasdiqlangan", c.approved],
    ["Yashirin", c.hidden],
  ];
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8 sm:py-10">
      <AdminNav active="grammar" />
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">Admin</span>
      <h1 className="display-cond mt-4 text-[clamp(34px,6vw,60px)]">Grammatika</h1>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="grammar-stats">
        {stats.map(([k, n]) => (
          <div key={k} className="border-[3px] border-ink bg-white p-3">
            <dt className="label">{k}</dt>
            <dd className="display-cond text-4xl">{n}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/admin/grammar/new">
          Yangi qoida
          <Arrow />
        </ButtonLink>
        <ButtonLink href="/admin/grammar/releases" variant="paper">
          Release&apos;lar
        </ButtonLink>
      </div>
      <div className="mt-8">
        <RuleList rules={rules} base="/admin/grammar" role="ADMIN" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<GrammarLoading />}>
      <Dashboard />
    </Suspense>
  );
}
