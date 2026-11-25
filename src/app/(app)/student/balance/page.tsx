import type { Metadata } from "next";
import { Suspense } from "react";
import { BalanceView } from "@/features/billing/BalanceView";
import type { CoursesView, WalletView } from "@/features/billing/types";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Balans", robots: { index: false } };

type Search = Promise<{ buy?: string }>;

async function BalanceContent({ searchParams }: { searchParams: Search }) {
  await requireRole("STUDENT");
  const [{ buy }, wallet, courses] = await Promise.all([searchParams, apiGet<WalletView>("/wallet"), apiGet<CoursesView>("/courses")]);
  return <BalanceView wallet={wallet} courses={courses} buyId={buy} />;
}

export default function BalancePage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <BalanceContent searchParams={searchParams} />
    </Suspense>
  );
}
