"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Accessible modal: native <dialog> + showModal(). Brauzer o'zi beradi: fokusni ichkariga o'tkazish va ushlab turish,
 * Escape bilan yopish, orqa fonni inert qilish. Yopilganda fokus chaqirgan elementga qaytadi.
 * `busy` paytida Escape va fon bosilishi e'tiborga olinmaydi (masalan, to'lov so'rovi ketayotganda).
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  busy = false,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  busy?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault(); // holatni React boshqaradi
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose(); // fon (backdrop) bosildi
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto border-[3px] border-ink bg-paper p-0 text-ink shadow-[10px_10px_0_0_var(--color-acid)] backdrop:bg-ink/60",
        className,
      )}
    >
      {open && <div className="p-6">{children}</div>}
    </dialog>
  );
}
