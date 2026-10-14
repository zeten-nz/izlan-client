import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { ROUTES } from "@/config/routes";
import { requireUser } from "@/server/session";
import { LogoutButton } from "../LogoutButton";
import { AppNav } from "./AppNav";
import { NavIcon } from "./NavIcon";

async function UserChip() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3">
      <span className="label hidden max-w-[160px] truncate sm:inline">@{user.username}</span>
      <LogoutButton />
    </div>
  );
}

/** Mobil: ixcham sarlavha (logo, Daftar, chiqish); asosiy bo'limlar pastki navigatsiyada. Desktop: o'zgarishsiz. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-2 px-3 min-[360px]:gap-3 min-[360px]:px-4 py-2.5 sm:px-8 sm:py-3">
        <Link href={ROUTES.student} aria-label="Izlan, asosiy" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Bo'limlar" className="hidden lg:block">
          <AppNav />
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`${ROUTES.student}/notebook`}
            aria-label="Daftar"
            className="grid size-10 shrink-0 place-items-center border-[3px] border-ink bg-white shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-acid focus-visible:outline-[3px] focus-visible:outline-cobalt lg:hidden"
          >
            <NavIcon id="notebook" className="size-5" />
          </Link>
          <Suspense fallback={<div className="h-10 w-20" />}>
            <UserChip />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
