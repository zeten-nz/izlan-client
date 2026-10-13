import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  index: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "dark" | "light";
  className?: string;
};

/** Bo‘lim sarlavhasi: raqam + yorliq + katta sarlavha + izoh. */
export function SectionHead({ index, kicker, title, lead, tone = "dark", className }: Props) {
  return (
    <header className={cn("max-w-4xl", className)}>
      <p className={cn("label mb-5 flex items-center gap-3", tone === "light" && "text-paper")}>
        <span className={cn("border-[3px] px-2 py-0.5", tone === "light" ? "border-paper" : "border-ink")}>{index}</span>
        {kicker}
      </p>
      <h2 className="display text-[clamp(40px,7.2vw,104px)]">{title}</h2>
      {lead && (
        <p className={cn("mt-6 max-w-2xl text-lg md:text-xl", tone === "light" ? "text-paper/85" : "text-ink/80")}>{lead}</p>
      )}
    </header>
  );
}
