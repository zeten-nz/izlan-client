import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/features/staff/AdminNav";
import { CatalogManager } from "@/features/staff/CatalogManager";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: ta'lim tuzilmasi", robots: { index: false } };

async function Catalog() {
  await requireRole("ADMIN");
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 sm:py-10">
      <AdminNav active="catalog" />
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">Admin</span>
      <h1 className="display-cond mt-4 text-[clamp(34px,6vw,60px)]">Ta&apos;lim tuzilmasi</h1>
      <p className="mt-3 max-w-2xl text-lg leading-snug text-ink/80">
        Yo&apos;nalish → Daraja → Mavzu. Shu yerda qo&apos;shgan narsangiz ustozlarning dars yaratish oynasida darrov ko&apos;rinadi. O&apos;quvchi izi bor
        element o&apos;chirilmaydi va tartibi o&apos;zgartirilmaydi.
      </p>
      <div className="mt-8">
        <CatalogManager />
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="label grid min-h-[50vh] place-items-center">Yuklanmoqda...</div>}>
      <Catalog />
    </Suspense>
  );
}
