import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES, roleHome, type Role } from "@/config/routes";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  role: Role;
};

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000";
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "izlan_session";

/** Joriy foydalanuvchi; sessiya yo'q yoki eskirgan bo'lsa /login ga yo'naltiradi. Har so'rovda serverdan tekshiradi. */
export async function requireUser(): Promise<SessionUser> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) redirect(ROUTES.login);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: `${COOKIE}=${token}` },
      cache: "no-store",
    });
  } catch {
    redirect(ROUTES.login);
  }
  if (!res.ok) redirect(ROUTES.login);
  const { user } = (await res.json()) as { user: SessionUser };
  return user;
}

/** Sahifa faqat shu rolga: boshqa rol o'z bosh sahifasiga yuboriladi. */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(roleHome(user.role));
  return user;
}
