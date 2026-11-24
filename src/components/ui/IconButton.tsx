import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Faqat ikonkali tugma/havola. `label` majburiy: u ham aria-label, ham tooltip (title) bo'ladi.
 * O'lcham 44x44 (WCAG 2.5.5 touch target), brutalist chegara va soya, ko'rinadigan fokus.
 */
const base =
  "grid size-11 shrink-0 place-items-center border-[3px] border-ink bg-white shadow-[3px_3px_0_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:bg-acid active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cobalt";

export function IconLink({ href, label, active, className, children }: { href: string; label: string; active?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} aria-current={active ? "page" : undefined} className={cn(base, active && "bg-acid", className)}>
      {children}
    </Link>
  );
}
