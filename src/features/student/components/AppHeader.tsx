import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { ROUTES } from "@/config/routes";
import { requireUser } from "@/server/session";
import { LogoutButton } from "../LogoutButton";
import { AppNav } from "./AppNav";

async function UserChip() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3">
      <span className="label hidden max-w-[160px] truncate sm:inline">@{user.username}</span>
      <LogoutButton />
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href={ROUTES.student} aria-label="Izlan, asosiy">
          <Logo />
        </Link>
        <nav aria-label="Bo'limlar" className="hidden md:block">
          <AppNav />
        </nav>
        <Suspense fallback={<div className="h-10 w-24" />}>
          <UserChip />
        </Suspense>
      </div>
      <nav aria-label="Bo'limlar" className="no-scrollbar overflow-x-auto border-t-[3px] border-ink md:hidden">
        <div className="min-w-max px-4 py-2">
          <AppNav />
        </div>
      </nav>
    </header>
  );
}
