import type { ReactNode } from "react";
import { AppHeader } from "@/features/student/components/AppHeader";

/** Talaba qismi: bitta umumiy yuqori panel (logo, bo'limlar, foydalanuvchi). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main>{children}</main>
    </div>
  );
}
