import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentHome } from "@/features/student/StudentHome";

export const metadata: Metadata = {
  title: "Talaba sahifasi",
  robots: { index: false },
};

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center label">Yuklanmoqda...</div>}>
      <StudentHome />
    </Suspense>
  );
}
