"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Furigana ko'rsatish/yashirish (CSS orqali: `[data-furigana="off"] rt, rp { display: none }`). Bola elementlar server'da render qilinadi. */
export function FuriganaScope({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(true);
  return (
    <div data-furigana={on ? "on" : "off"}>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "label mb-6 inline-flex min-h-11 items-center gap-2 border-[3px] border-ink px-3 py-2",
          on ? "bg-acid shadow-[3px_3px_0_0_var(--color-ink)]" : "bg-white",
        )}
      >
        <span aria-hidden>ふ</span>
        Furigana: {on ? "ko‘rsatilgan" : "yashirin"}
      </button>
      {children}
    </div>
  );
}
