import type { Metadata } from "next";
import { Suspense } from "react";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Ustoz paneli", robots: { index: false } };

async function Teacher() {
  const user = await requireRole("TEACHER");
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-14">
      <p className="label">Ustoz paneli</p>
      <h1 className="display mt-2 text-[clamp(36px,7vw,88px)]">
        Salom, {user.firstName}
        <span className="text-tomato">.</span>
      </h1>
      <ButtonLink href="/teacher/lessons" size="lg" className="mt-8">
        Darslarim
        <Arrow />
      </ButtonLink>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <Suspense fallback={<div className="label grid min-h-[50vh] place-items-center">Yuklanmoqda...</div>}>
      <Teacher />
    </Suspense>
  );
}
