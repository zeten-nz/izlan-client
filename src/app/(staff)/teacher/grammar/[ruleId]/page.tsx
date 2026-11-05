import type { Metadata } from "next";
import { Suspense } from "react";
import { GrammarLoading, RulePage } from "@/features/grammar-admin/RulePage";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Qoida muharriri", robots: { index: false } };

type Props = { params: Promise<{ ruleId: string }>; searchParams: Promise<{ rev?: string }> };

async function Rule({ params, searchParams }: Props) {
  await requireRole("TEACHER");
  const [{ ruleId }, { rev }] = await Promise.all([params, searchParams]);
  return <RulePage ruleId={ruleId} rev={rev} role="TEACHER" base="/teacher/grammar" />;
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<GrammarLoading />}>
      <Rule {...props} />
    </Suspense>
  );
}
