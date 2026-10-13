"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGetJson } from "@/lib/api";
import type { Paged } from "./types";

type Data<T> = { key: string; items: T[]; total: number; error: string };

function url(path: string, key: string, page: number, pageSize: number) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(JSON.parse(key) as Record<string, string | undefined>)) if (v) qs.set(k, v);
  qs.set("page", String(page));
  qs.set("limit", String(pageSize));
  return `${path}?${qs}`;
}

/**
 * Sahifalangan ro'yxat. Filtr o'zgarsa "yuklanmoqda" ko'rsatib boshidan yuklaydi;
 * `reload()` esa eski ro'yxatni ko'rsatib turib jimgina yangilaydi. Davomi "Yana ko'rsatish" bilan qo'shiladi.
 */
export function usePagedList<T extends { id: string }>(path: string, params: Record<string, string | undefined>, pageSize = 20) {
  const key = JSON.stringify(params);
  const [data, setData] = useState<Data<T>>({ key: "", items: [], total: 0, error: "" });
  const [nonce, setNonce] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
    let cancelled = false;
    void (async () => {
      const r = await apiGetJson<Paged<T>>(url(path, key, 1, pageSize));
      if (cancelled) return;
      pageRef.current = 1;
      if (r.ok) setData({ key, items: r.data.items, total: r.data.total, error: "" });
      else setData({ key, items: [], total: 0, error: r.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [path, key, nonce, pageSize]);

  const loadMore = useCallback(async () => {
    const myKey = key;
    setLoadingMore(true);
    const r = await apiGetJson<Paged<T>>(url(path, myKey, pageRef.current + 1, pageSize));
    setLoadingMore(false);
    if (!r.ok || keyRef.current !== myKey) return;
    pageRef.current += 1;
    const next = r.data;
    setData((cur) => ({ ...cur, total: next.total, items: [...cur.items, ...next.items.filter((n) => !cur.items.some((c) => c.id === n.id))] }));
  }, [path, key, pageSize]);

  const status: "loading" | "ready" | "error" = data.key !== key ? "loading" : data.error ? "error" : "ready";

  return {
    items: data.key === key ? data.items : [],
    total: data.total,
    status,
    error: data.error,
    loadingMore,
    hasMore: data.items.length < data.total,
    loadMore,
    reload: () => setNonce((n) => n + 1),
    /** Mijoz tomonida yozuvni darrov yangilash (server javobidan keyin) */
    patch: (id: string, next: T) => setData((cur) => ({ ...cur, items: cur.items.map((i) => (i.id === id ? next : i)) })),
    remove: (id: string) => setData((cur) => ({ ...cur, items: cur.items.filter((i) => i.id !== id), total: Math.max(0, cur.total - 1) })),
  };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
