import type { ReactNode } from "react";
import { StudentShell } from "@/features/student/components/StudentShell";

/** Talaba qismi: yuqori panel (logo, bo'limlar, foydalanuvchi) + mobilda pastki navigatsiya. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
