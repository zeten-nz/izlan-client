import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgressPage, type ProgressTab } from "@/features/student/ProgressPage";

export const metadata: Metadata = { title: "Jarayon", robots: { index: false } };

async function Content({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const current: ProgressTab = tab === "xarita" ? "xarita" : "jarayon";
  return <ProgressPage tab={current} />;
}

export default function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
