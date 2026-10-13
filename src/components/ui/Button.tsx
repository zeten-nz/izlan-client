import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "acid" | "ink" | "paper" | "tomato";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  acid: "bg-acid text-ink",
  ink: "bg-ink text-paper",
  paper: "bg-paper text-ink",
  tomato: "bg-tomato text-ink",
};
const SIZES: Record<Size, string> = {
  md: "px-5 py-3 text-[15px]",
  lg: "px-7 py-4 text-[17px] md:px-9 md:py-5 md:text-xl",
};

export function buttonClasses(variant: Variant = "acid", size: Size = "md", className?: string) {
  return cn(
    "group relative inline-flex items-center justify-center gap-2.5 border-[3px] border-ink font-display font-black uppercase tracking-tight",
    "[font-variation-settings:'wdth'_110] shadow-[5px_5px_0_0_var(--color-ink)]",
    "transition-[transform,box-shadow] duration-150 ease-out",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-ink)]",
    "active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_var(--color-ink)]",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
};

/** Ichki yo‘nalishlar uchun tugma-havola. */
export function ButtonLink({ variant, size, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[1.1em] transition-transform group-hover:translate-x-1", className)} aria-hidden>
      <path d="M3 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
