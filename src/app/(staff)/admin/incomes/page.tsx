import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/features/staff/AdminNav";
import { IncomesManager } from "@/features/staff/IncomesManager";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: kirimlar", robots: { index: false } };

async function Incomes() {
  await requireRole("ADMIN");
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-10">
      <AdminNav active="incomes" />
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">Admin</span>
      <h1 className="display-cond mt-4 text-[clamp(34px,6vw,60px)]">Kirimlar</h1>
      <p className="mt-3 max-w-2xl text-lg leading-snug text-ink/80">
        Kartaga tushgan pullarni kiriting — summa o&apos;quvchining so&apos;roviga mos kelsa, balansi darhol to&apos;ldiriladi.
      </p>
      <div className="mt-8">
        <IncomesManager />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <Incomes />
    </Suspense>
  );
}
