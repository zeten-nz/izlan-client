import { LogoMark } from "./LogoMark";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Faqat belgi (kichik joylar uchun) */
  markOnly?: boolean;
  /** Matn rangi: qora fonda "light" ishlating */
  tone?: "dark" | "light";
};

export function Logo({ className, markOnly = false, tone = "dark" }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark className="size-9 shrink-0 border-[3px] border-ink shadow-[3px_3px_0_0_var(--color-ink)]" />
      {!markOnly && (
        <span
          className={cn(
            "display text-[26px] lowercase leading-none tracking-tight",
            tone === "light" ? "text-paper" : "text-ink",
          )}
        >
          izlan
          <span className="text-tomato">.</span>
        </span>
      )}
      <span className="sr-only">Izlan</span>
    </span>
  );
}
