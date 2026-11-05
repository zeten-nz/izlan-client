import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

/** Talaba qobig'i: yuqori panel + mobilda pastki navigatsiya. (app) va ichki ulashilgan sahifalar (grammatika) ishlatadi. */
export function StudentShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
