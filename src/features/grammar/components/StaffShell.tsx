import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { roleHome } from "@/config/routes";
import { LogoutButton } from "@/features/student/LogoutButton";
import type { SessionUser } from "@/server/session";

/** Ustoz/admin uchun ichki sahifa qobig'i (grammatika): o'z paneliga qaytish va chiqish. */
export function StaffShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const home = roleHome(user.role);
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-8 sm:py-3">
          <Link href={home} aria-label="Izlan, panelga qaytish" className="shrink-0">
            <span className="min-[400px]:hidden"><Logo markOnly /></span>
            <span className="hidden min-[400px]:block"><Logo /></span>
          </Link>
          <nav aria-label="Bo'limlar" className="flex min-w-0 items-center gap-2">
            <Link
              href={home}
              className="label inline-flex min-h-10 items-center border-[3px] border-ink bg-white px-3 py-2 hover:bg-acid"
            >
              ← Panelga qaytish
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="label hidden border-[3px] border-ink bg-acid px-2.5 py-1.5 md:inline">
              {user.role === "ADMIN" ? "Admin" : "Ustoz"}
            </span>
            <span className="label hidden max-w-[160px] truncate lg:inline">@{user.username}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
