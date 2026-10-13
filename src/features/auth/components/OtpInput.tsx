"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

const LEN = 6;

type Props = {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

/** 6 xonali raqamli kod. Qo'yish (paste), orqaga o'chirish va email'dan avtomatik to'ldirishni qo'llaydi. */
export function OtpInput({ value, onChange, onComplete, error, disabled, autoFocus }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LEN }, (_, i) => value[i] ?? "");

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, LEN);
    onChange(clean);
    if (clean.length === LEN) onComplete?.(clean);
    return clean;
  };

  const setAt = (i: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) return;
    const next = commit(value.slice(0, i) + incoming + value.slice(i + incoming.length));
    refs.current[Math.min(i + incoming.length, LEN - 1, next.length)]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) commit(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        commit(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const next = commit(e.clipboardData.getData("text"));
    refs.current[Math.min(next.length, LEN - 1)]?.focus();
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3" role="group" aria-label="6 xonali tasdiqlash kodi">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          pattern="\d*"
          maxLength={LEN}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          aria-label={`${i + 1}-raqam`}
          aria-invalid={error || undefined}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "aspect-[3/4] w-full min-w-0 border-[3px] border-ink bg-white text-center font-mono text-3xl font-bold shadow-[3px_3px_0_0_var(--color-ink)] outline-none transition sm:text-4xl",
            "focus:-translate-y-0.5 focus:bg-acid focus:shadow-[5px_5px_0_0_var(--color-cobalt)]",
            error && "bg-tomato/20",
          )}
        />
      ))}
    </div>
  );
}
