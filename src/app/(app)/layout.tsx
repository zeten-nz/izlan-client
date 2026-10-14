import type { ReactNode } from "react";
import { AppHeader } from "@/features/student/components/AppHeader";
import { BottomNav } from "@/features/student/components/BottomNav";

/** Talaba qismi: yuqori panel (logo, bo'limlar, foydalanuvchi) + mobilda pastki navigatsiya. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
