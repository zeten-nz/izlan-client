"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/config/routes";

type Props = { children: ReactNode; className?: string; "aria-label"?: string; onNavigate?: () => void };

/**
 * Logo havolasi. Bosh sahifada (masalan, "/#menga-mosmi" da) turgan bo'lsa, Next buni "o'sha sahifa" deb
 * hisoblab hech narsa qilmaydi; shuning uchun o'zimiz tepaga silliq chiqaramiz va URL'dagi #hash'ni olib tashlaymiz.
 */
export function HomeLink({ children, className, onNavigate, ...rest }: Props) {
  const pathname = usePathname();
  return (
    <Link
      href={ROUTES.home}
      className={className}
      aria-label={rest["aria-label"]}
      onClick={(e) => {
        onNavigate?.();
        if (pathname !== ROUTES.home) return;
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        if (window.location.hash) window.history.replaceState(null, "", ROUTES.home);
      }}
    >
      {children}
    </Link>
  );
}
