import type { Metadata } from "next";
import { Suspense } from "react";
import { AddTeacherForm } from "@/features/staff/AddTeacherForm";
import { AdminNav } from "@/features/staff/AdminNav";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: ustoz qo'shish", robots: { index: false } };

async function Admin() {
  await requireRole("ADMIN");
  return (
    <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-8 sm:py-14">
      <AdminNav active="teachers" />
      <span className="label inline-block -rotate-2 border-[3px] border-ink bg-acid px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">Admin</span>
      <h1 className="display-cond mt-4 text-[clamp(38px,7vw,68px)]">Ustoz qo&apos;shish</h1>
      <p className="mt-3 max-w-lg text-lg leading-snug text-ink/80">
        Ustozning ma&apos;lumotlari va boshlang&apos;ich parolini kiriting. Ustoz shu username yoki email bilan kiradi.
      </p>
      <div className="mt-8">
        <AddTeacherForm />
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="label grid min-h-[50vh] place-items-center">Yuklanmoqda...</div>}>
      <Admin />
    </Suspense>
  );
}
