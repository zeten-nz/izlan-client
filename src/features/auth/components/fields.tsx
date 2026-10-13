"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const INPUT =
  "w-full border-[3px] border-ink bg-white px-4 py-3.5 text-[17px] leading-tight shadow-[4px_4px_0_0_var(--color-ink)] outline-none transition-[box-shadow,background-color,transform] placeholder:text-ink/40 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:bg-acid/25 focus:shadow-[6px_6px_0_0_var(--color-cobalt)]";

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="label mt-2.5 inline-block border-[3px] border-ink bg-tomato px-2.5 py-1 normal-case tracking-normal">
      {children}
    </p>
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
};

export function Field({ label, error, hint, className, id, ...input }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label mb-2 block">
        {label}
      </label>
      <input
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        className={cn(INPUT, error && "bg-tomato/15")}
        {...input}
      />
      {hint && !error && (
        <p id={`${fid}-hint`} className="mt-2 text-sm text-ink/70">
          {hint}
        </p>
      )}
      <FieldError id={`${fid}-err`}>{error}</FieldError>
    </div>
  );
}

export function PasswordField({ label, error, hint, className, id, ...input }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={fid} className="label mb-2 block">
        {label}
      </label>
      <div className="relative">
        <input
          id={fid}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : undefined}
          className={cn(INPUT, "pr-[84px]", error && "bg-tomato/15")}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={shown ? "Parolni yashirish" : "Parolni ko'rsatish"}
          className="label absolute right-2 top-1/2 -translate-y-1/2 border-2 border-ink bg-paper px-2 py-1.5 hover:bg-acid"
        >
          {shown ? "Yashir" : "Ko'rsat"}
        </button>
      </div>
      {hint && !error && <p className="mt-2 text-sm text-ink/70">{hint}</p>}
      <FieldError id={`${fid}-err`}>{error}</FieldError>
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & { label: ReactNode; className?: string }) {
  return (
    <label className={cn("group inline-flex cursor-pointer select-none items-center gap-3", className)}>
      <input type="checkbox" className="peer sr-only" {...input} />
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center border-[3px] border-ink bg-white shadow-[3px_3px_0_0_var(--color-ink)] transition peer-checked:bg-acid peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-3 peer-focus-visible:outline-cobalt"
      >
        <svg viewBox="0 0 24 24" className="size-5 opacity-0 transition-opacity">
          <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        </svg>
      </span>
      <span className="font-medium">{label}</span>
    </label>
  );
}

/** Forma tugmasi: Button.tsx bilan bir xil ko'rinish, yuborilayotganda band. */
export function SubmitButton({ children, pending, className }: { children: ReactNode; pending?: boolean; className?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        "group inline-flex w-full items-center justify-center gap-2.5 border-[3px] border-ink bg-acid px-7 py-4 font-display text-[17px] font-black uppercase tracking-tight text-ink",
        "[font-variation-settings:'wdth'_110] shadow-[5px_5px_0_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 ease-out",
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-ink)]",
        "active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_var(--color-ink)]",
        "disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_0_var(--color-ink)]",
        className,
      )}
    >
      {pending ? "Kuting..." : children}
    </button>
  );
}

/** Formaning umumiy xatosi (maydonga tegishli bo'lmagan). */
export function FormAlert({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="border-[3px] border-ink bg-tomato px-4 py-3 font-semibold shadow-[4px_4px_0_0_var(--color-ink)]">
      {children}
    </div>
  );
}
