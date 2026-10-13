"use client";

import { useEffect } from "react";
import { useCountdown } from "./useCountdown";

type Props = {
  /** Birinchi yuborishdan keyin kutish soniyalari */
  initialSeconds: number;
  onResend: () => Promise<number | null>;
};

/** "Kodni qayta yuborish" tugmasi: kutish tugamaguncha o'chiq turadi. */
export function ResendCode({ initialSeconds, onResend }: Props) {
  const { left, start } = useCountdown();

  useEffect(() => {
    start(initialSeconds);
  }, [initialSeconds, start]);

  return (
    <button
      type="button"
      disabled={left > 0}
      onClick={async () => {
        const next = await onResend();
        if (next !== null) start(next);
      }}
      className="label border-[3px] border-ink bg-paper px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] enabled:hover:bg-acid disabled:cursor-not-allowed disabled:opacity-60"
    >
      {left > 0 ? `Qayta yuborish: ${left} s` : "Kodni qayta yuborish"}
    </button>
  );
}
