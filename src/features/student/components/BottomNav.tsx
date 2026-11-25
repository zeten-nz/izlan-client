"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";
import { NavIcon } from "./NavIcon";
import { PRIMARY_NAV } from "./nav";

const S = ROUTES.student;

/** Mobil pastki navigatsiya (lg dan past): 5 ta bo'lim (nav.ts). Daftar, Grammatika va Balans — sarlavhada. */
const ITEMS = PRIMARY_NAV;

/** Dars/test (fokus rejimi) va forma yozilayotganda (klaviatura ochiq) navigatsiya yashirinadi. */
const FOCUS_MODE = (p: string) => p.startsWith(`${S}/lesson/`) || p.startsWith(`${S}/test/`);

export function BottomNav() {
  const pathname = usePathname();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Faqat matn kiritiladigan maydonlar (klaviatura ochiladiganlar); radio/checkbox/tugma emas
    const isTextField = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        (t instanceof HTMLInputElement && !["radio", "checkbox", "button", "submit", "reset", "range", "file", "color"].includes(t.type)));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const on = (e: FocusEvent) => {
      if (!isTextField(e.target)) return;
      clearTimeout(timer);
      setTyping(true);
    };
    // Qaytish kechiktiriladi: maydondan tugmaga o'tishda (blur -> click) navigatsiya tugma ustiga chiqib qolmasin
    const off = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setTyping(false), 350);
    };
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      clearTimeout(timer);
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
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[60px] flex-col items-center justify-center gap-0.5 border-r-[3px] border-ink text-[10px] font-black uppercase leading-none tracking-tight min-[360px]:text-[11px] last:border-r-0 focus-visible:outline-[3px] focus-visible:-outline-offset-4 focus-visible:outline-cobalt",
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
