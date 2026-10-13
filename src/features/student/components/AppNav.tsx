"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/cn";

const S = ROUTES.student;

/** Asosiy faqat o'zi (aniq moslik); qolganlari prefiks bo'yicha. Mavzu/dars sahifalari "Yo'nalishlar" ostida. */
const ITEMS = [
  { label: "Asosiy", href: S, match: (p: string) => p === S },
  { label: "Yo'nalishlar", href: `${S}/directions`, match: (p: string) => p.startsWith(`${S}/directions`) || p.startsWith(`${S}/topic`) || p.startsWith(`${S}/lesson`) },
  { label: "Jarayon", href: `${S}/progress`, match: (p: string) => p.startsWith(`${S}/progress`) },
  { label: "Daftar", href: `${S}/notebook`, match: (p: string) => p.startsWith(`${S}/notebook`) },
  { label: "Hisobim", href: `${S}/account`, match: (p: string) => p.startsWith(`${S}/account`) },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1.5">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "label inline-flex items-center gap-2 border-[3px] border-ink px-3 py-2",
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
