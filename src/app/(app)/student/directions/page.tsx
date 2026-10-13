import type { Metadata } from "next";
import { Suspense } from "react";
import { DirectionsPage } from "@/features/student/SimplePages";

export const metadata: Metadata = { title: "Yo'nalishlar", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="label grid min-h-[60vh] place-items-center">Yuklanmoqda...</div>}>
      <DirectionsPage />
    </Suspense>
  );
}
