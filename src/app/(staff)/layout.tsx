import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/features/student/LogoutButton";
import { requireUser } from "@/server/session";
import { roleHome } from "@/config/routes";

async function Who() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3">
      <span className="label hidden border-[3px] border-ink bg-acid px-2.5 py-1.5 sm:inline">{user.role === "ADMIN" ? "Admin" : "Ustoz"}</span>
      <span className="label hidden max-w-[160px] truncate sm:inline">@{user.username}</span>
      <LogoutButton />
    </div>
  );
}

/** Admin va ustoz qismi: umumiy yuqori panel. */
export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-[3px] border-ink">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link href={roleHome("ADMIN")} aria-label="Izlan">
            <Logo />
          </Link>
          <Suspense fallback={<div className="h-10 w-24" />}>
            <Who />
          </Suspense>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
