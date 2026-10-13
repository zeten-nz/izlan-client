import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: "acid" | "tomato" | "bubble" | "sky" | "paper" | "ink" | "cobalt";
  rotate?: number;
};

const TONES = {
  acid: "bg-acid text-ink",
  tomato: "bg-tomato text-ink",
  bubble: "bg-bubble text-ink",
  sky: "bg-sky text-ink",
  paper: "bg-paper text-ink",
  ink: "bg-ink text-paper",
  cobalt: "bg-cobalt text-paper",
} as const;

/** Qiyshaygan, qalin chiziqli yorliq (maksimalizm elementi). */
export function Sticker({ children, className, tone = "acid", rotate = -3 }: Props) {
  return (
    <span
      style={{ rotate: `${rotate}deg` }}
      className={cn(
        "label inline-block border-[3px] border-ink px-3 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
