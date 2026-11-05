"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { parseBackTarget } from "@/lib/grammar/back";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

/**
 * Qoida client'da topilmasa (masalan: server reyestrida bor, client hali deploy qilinmagan yoki qoida olib tashlangan)
 * o'quvchi darsidan kelgan bo'lsa, darsga qaytish tugmasi ko'rsatiladi. Manzil URL'dan olinmaydi, ID'lardan quriladi.
 */
export function BackToLesson() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const params = Object.fromEntries(new URLSearchParams(search));
  const target = parseBackTarget(params);
  if (!target) return null;
  return (
    <Link
      href={target.href}
      data-testid="grammar-missing-back"
      className="label inline-flex min-h-11 items-center border-[3px] border-ink bg-white px-4 py-2 shadow-[4px_4px_0_0_var(--color-ink)]"
    >
      ← {target.label}
    </Link>
  );
}
