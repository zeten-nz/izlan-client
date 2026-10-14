import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/features/staff/AdminNav";
import { CosmeticsManager } from "@/features/profile/CosmeticsManager";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: bezaklar", robots: { index: false } };

async function Cosmetics() {
  await requireRole("ADMIN");
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-10">
      <AdminNav active="cosmetics" />
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">Admin</span>
      <h1 className="display-cond mt-4 text-[clamp(34px,6vw,60px)]">Bezaklar katalogi</h1>
      <p className="mt-3 max-w-2xl text-lg leading-snug text-ink/80">
        Ramka, banner, effekt va unvonlar. Bezak o&apos;chirilmaydi: to&apos;xtatilsa ham egalarida qoladi.
      </p>
      <div className="mt-8">
        <CosmeticsManager />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <Cosmetics />
    </Suspense>
  );
}
