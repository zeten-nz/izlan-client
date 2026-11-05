import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { RouteLoading } from "@/components/loader/RouteLoading";
import { StaffShell } from "@/features/grammar/components/StaffShell";
import { StudentShell } from "@/features/student/components/StudentShell";
import { requireUser } from "@/server/session";

/** Ichki (login talab qiladigan) sahifalar: indekslanmaydi. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Barcha rollar uchun ulashilgan ichki bo'lim (grammatika). Marketing qobig'i EMAS:
 * talaba o'z navigatsiyasini, ustoz/admin o'z panelga qaytish imkoniyatini ko'radi.
 * Sessiya `requireUser()` orqali tekshiriladi (cookie yo'q yoki eskirgan bo'lsa /login).
 * Request ma'lumoti (cookie) Suspense ichida o'qiladi: Cache Components talabi.
 */
export default function SharedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <RoleShell>{children}</RoleShell>
    </Suspense>
  );
}

async function RoleShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  if (user.role === "STUDENT") return <StudentShell>{children}</StudentShell>;
  return <StaffShell user={user}>{children}</StaffShell>;
}
