"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { NavIcon, type NavIconId } from "./NavIcon";

const S = ROUTES.student;

/** Mobil pastki navigatsiya (lg dan past). Daftar sarlavhadagi ikonkada; barcha marshrutlar saqlanadi. */
const ITEMS: { label: string; href: string; icon: NavIconId; match: (p: string) => boolean }[] = [
  { label: "Asosiy", href: S, icon: "home", match: (p) => p === S },
  { label: "O'qish", href: `${S}/directions`, icon: "learn", match: (p) => p.startsWith(`${S}/directions`) || p.startsWith(`${S}/topic`) || p.startsWith(`${S}/lesson`) || p.startsWith(`${S}/test`) },
  { label: "Jarayon", href: `${S}/progress`, icon: "progress", match: (p) => p.startsWith(`${S}/progress`) },
  { label: "Mukofotlar", href: `${S}/rewards`, icon: "rewards", match: (p) => p.startsWith(`${S}/rewards`) },
  { label: "Profil", href: `${S}/account`, icon: "profile", match: (p) => p.startsWith(`${S}/account`) || p.startsWith("/u/") },
];

/** Dars/test (fokus rejimi) va forma yozilayotganda (klaviatura ochiq) navigatsiya yashirinadi. */
const FOCUS_MODE = (p: string) => p.startsWith(`${S}/lesson/`) || p.startsWith(`${S}/test/`);

export function BottomNav() {
  const pathname = usePathname();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const on = (e: FocusEvent) => isField(e.target) && setTyping(true);
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
    };
  }, []);

  if (FOCUS_MODE(pathname) || typing) return null;

  return (
    <nav
      aria-label="Asosiy bo'limlar"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-[560px] grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[60px] flex-col items-center justify-center gap-0.5 border-r-[3px] border-ink text-[9px] font-black uppercase leading-none tracking-tighter min-[360px]:text-[10px] min-[360px]:tracking-tight last:border-r-0 focus-visible:outline-[3px] focus-visible:-outline-offset-4 focus-visible:outline-cobalt",
                  active ? "bg-acid" : "bg-paper active:bg-acid/60",
                )}
              >
                <NavIcon id={item.icon} className="size-6" />
                <span className="max-w-full truncate px-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
