import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Ilova sahifalari uchun yagona konteyner va sarlavha (design system).
 * Kenglik: "wide" — ro'yxat/dashboard (1180px), "narrow" — profil/forma (980px).
 * Barcha student sahifalari bir xil gorizontal chekinish (px-4 / sm:px-8) va sarlavha shkalasidan foydalanadi.
 */
export function PageContainer({
  width = "wide",
  className,
  children,
}: {
  width?: "wide" | "narrow";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto px-4 py-8 sm:px-8 sm:py-10", width === "wide" ? "max-w-[1180px]" : "max-w-[980px]", className)}>
      {children}
    </div>
  );
}

/** Sahifa sarlavhasi: kichik yorliq (eyebrow) + katta "display" sarlavha + ixtiyoriy amal/izoh o'ng tomonda. */
export function PageHeader({
  eyebrow,
  title,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="label">{eyebrow}</p>
        <h1 className="display mt-2 text-[clamp(32px,5vw,60px)] [overflow-wrap:anywhere]">{title}</h1>
      </div>
      {aside}
    </header>
  );
}
