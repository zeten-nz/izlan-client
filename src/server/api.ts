import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000";
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "izlan_session";

/** Backendga sessiya cookie'si bilan GET. 401 → /login, 403/404 → onForbidden yoki 404 sahifa. */
export async function apiGet<T>(path: string, opts: { forbiddenTo?: string } = {}): Promise<T> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) redirect(ROUTES.login);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { headers: { cookie: `${COOKIE}=${token}` }, cache: "no-store" });
  } catch {
    throw new Error("Server bilan aloqa yo'q");
  }
  if (res.status === 401) redirect(ROUTES.login);
  if (res.status === 403 && opts.forbiddenTo) redirect(opts.forbiddenTo);
  if (res.status === 404 || res.status === 403) notFound();
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}
