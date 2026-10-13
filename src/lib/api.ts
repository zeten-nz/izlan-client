/**
 * Backend bilan aloqa. Brauzer `/api/*` ga murojaat qiladi, Next uni serverga yo'naltiradi (next.config rewrites),
 * shuning uchun cookie bir origin'da qoladi va CORS kerak emas.
 */
export type FieldErrors = Record<string, string>;

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; fieldErrors: FieldErrors; retryAfterSeconds?: number };

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok) return { ok: true, data: json as T };
    const fieldErrors =
      json && typeof json.errors === "object" && json.errors ? (json.errors as FieldErrors) : {};
    return {
      ok: false,
      status: res.status,
      message: typeof json?.message === "string" ? json.message : "Xatolik yuz berdi. Qayta urinib ko'ring",
      fieldErrors,
      retryAfterSeconds: typeof json?.retryAfterSeconds === "number" ? json.retryAfterSeconds : undefined,
    };
  } catch {
    return { ok: false, status: 0, message: "Server bilan aloqa yo'q. Internetni tekshiring", fieldErrors: {} };
  }
}

export async function apiGetJson<T = unknown>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api${path}`, { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok) return { ok: true, data: json as T };
    return {
      ok: false,
      status: res.status,
      message: typeof json?.message === "string" ? json.message : "Xatolik yuz berdi. Qayta urinib ko'ring",
      fieldErrors: {},
    };
  } catch {
    return { ok: false, status: 0, message: "Server bilan aloqa yo'q. Internetni tekshiring", fieldErrors: {} };
  }
}

/** PUT / DELETE kabi qolgan usullar uchun (JSON tana ixtiyoriy). */
export async function apiSend<T = unknown>(method: "PUT" | "DELETE" | "PATCH", path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok) return { ok: true, data: json as T };
    return {
      ok: false,
      status: res.status,
      message: typeof json?.message === "string" ? json.message : "Xatolik yuz berdi. Qayta urinib ko'ring",
      fieldErrors: {},
    };
  } catch {
    return { ok: false, status: 0, message: "Server bilan aloqa yo'q. Internetni tekshiring", fieldErrors: {} };
  }
}

/** Fayl yuklash (multipart). */
export async function apiUpload<T = unknown>(path: string, file: File): Promise<ApiResult<T>> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api${path}`, { method: "POST", body: fd });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok) return { ok: true, data: json as T };
    return {
      ok: false,
      status: res.status,
      message: typeof json?.message === "string" ? json.message : "Faylni yuklab bo'lmadi",
      fieldErrors: {},
    };
  } catch {
    return { ok: false, status: 0, message: "Server bilan aloqa yo'q. Internetni tekshiring", fieldErrors: {} };
  }
}
