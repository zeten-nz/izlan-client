import type { Metadata } from "next";
import { Suspense } from "react";
import { NotebookPage } from "@/features/notebook/NotebookPage";

export const metadata: Metadata = { title: "Daftar", robots: { index: false } };

export default function Page({ searchParams }: { searchParams: Promise<{ bolim?: string }> }) {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <NotebookContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NotebookContent({ searchParams }: { searchParams: Promise<{ bolim?: string }> }) {
  const { bolim } = await searchParams;
  return <NotebookPage section={bolim} />;
}
