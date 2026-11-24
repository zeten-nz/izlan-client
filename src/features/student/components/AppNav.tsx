"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PRIMARY_NAV } from "./nav";

/** Desktop (lg+) asosiy bo'limlar — mobil pastki panel bilan bir xil ro'yxat va nomlar (nav.ts). */
export function AppNav() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1.5">
      {PRIMARY_NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "label inline-flex min-h-11 items-center gap-2 border-[3px] border-ink px-3 py-2 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cobalt",
                active ? "bg-ink text-paper shadow-[3px_3px_0_0_var(--color-acid)]" : "bg-white hover:bg-acid",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
