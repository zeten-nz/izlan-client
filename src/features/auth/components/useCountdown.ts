"use client";

import { useCallback, useEffect, useState } from "react";

/** Soniyalar bo'yicha teskari sanoq (kodni qayta yuborish uchun). */
export function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const start = useCallback((seconds: number) => setLeft(Math.max(0, Math.ceil(seconds))), []);
  return { left, start };
}
