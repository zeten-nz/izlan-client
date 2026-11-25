"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ROUTES } from "@/config/routes";
import { apiPost } from "@/lib/api";
import { cn } from "@/lib/cn";

const btn =
  "label inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap border-[3px] border-ink px-4 py-2 shadow-[3px_3px_0_0_var(--color-ink)] focus-visible:outline-[3px] focus-visible:outline-cobalt disabled:opacity-60";

/**
 * Hisobdan chiqish: avval tasdiqlash oynasi (tasodifiy bosishdan himoya), so'ng server sessiyasi o'chiriladi.
 * Server javob bermasa foydalanuvchiga aytiladi — sessiya serverda qolib ketgan bo'lishi mumkin (SEC-13).
 */
export function LogoutButton({ className, label = "Chiqish" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setError(null);
    const res = await apiPost("/auth/logout", {});
    if (!res.ok) {
      setPending(false);
      setError(res.message);
      return;
    }
    window.location.assign(ROUTES.login);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(btn, "bg-white hover:bg-acid", className)}>
        {label}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="logout-title" busy={pending}>
        <h2 id="logout-title" className="display-cond text-3xl">
          Hisobdan chiqasizmi?
        </h2>
        <p className="mt-3">Keyingi safar kirish uchun username/email va parol kerak bo&apos;ladi.</p>
        {error && (
          <p role="alert" className="mt-3 border-l-[6px] border-tomato pl-3 font-semibold">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={logout} disabled={pending} className={cn(btn, "bg-tomato")}>
            {pending ? "Chiqilmoqda..." : "Ha, chiqish"}
          </button>
          <button type="button" onClick={() => setOpen(false)} disabled={pending} className={cn(btn, "bg-white")} autoFocus>
            Bekor qilish
          </button>
        </div>
      </Dialog>
    </>
  );
}
