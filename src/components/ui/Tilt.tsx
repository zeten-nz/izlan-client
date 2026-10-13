"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maksimal burilish burchagi (gradus) */
  max?: number;
};

/**
 * Sichqoncha (yoki barmoq) harakatiga ergashuvchi 3D burilish.
 * Faqat transform o‘zgaradi, layout ta’sirlanmaydi.
 */
export function Tilt({ children, className, max = 10 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${px * max * 2}deg) rotateX(${-py * max * 2}deg) translateZ(0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "perspective(1000px) rotateY(0) rotateX(0)";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn("preserve-3d transition-transform duration-200 ease-out will-change-transform", className)}
    >
      {children}
    </div>
  );
}
