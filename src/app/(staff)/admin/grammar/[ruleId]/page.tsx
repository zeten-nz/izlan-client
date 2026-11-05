import type { Metadata } from "next";
import { Suspense } from "react";
import { GrammarLoading, RulePage } from "@/features/grammar-admin/RulePage";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: qoida", robots: { index: false } };

type Props = { params: Promise<{ ruleId: string }>; searchParams: Promise<{ rev?: string }> };

async function Rule({ params, searchParams }: Props) {
  await requireRole("ADMIN");
  const [{ ruleId }, { rev }] = await Promise.all([params, searchParams]);
  return <RulePage ruleId={ruleId} rev={rev} role="ADMIN" base="/admin/grammar" />;
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<GrammarLoading />}>
      <Rule {...props} />
    </Suspense>
  );
}
