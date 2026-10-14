import type { Metadata } from "next";
import { Suspense } from "react";
import { RewardsPage } from "@/features/profile/pages";

export const metadata: Metadata = { title: "Mukofotlar", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <RewardsPage />
    </Suspense>
  );
}
