import { ROUTES } from "@/config/routes";
import type { NavIconId } from "./NavIcon";

const S = ROUTES.student;

export type NavItem = { label: string; href: string; icon: NavIconId; match: (pathname: string) => boolean };

/**
 * Talaba navigatsiyasining YAGONA manbasi: desktop (AppNav) va mobil pastki panel (BottomNav) bir xil
 * 5 ta bo'limni bir xil nomda ko'rsatadi.
 * Balans (so'm) bu yerda yo'q: u Profil sahifasidagi kartada va pullik mavzudagi havolada — real pul XP/IZL (o'yin ballari)
 * bilan bitta joyda aralashmasin. Daftar va Grammatika — sarlavhadagi ikonka-havolalar (SECONDARY_NAV).
 */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Asosiy", href: S, icon: "home", match: (p) => p === S },
  {
    label: "O'qish",
    href: `${S}/directions`,
    icon: "learn",
    match: (p) => [`${S}/directions`, `${S}/topic`, `${S}/lesson`, `${S}/test`].some((x) => p.startsWith(x)),
  },
  { label: "Jarayon", href: `${S}/progress`, icon: "progress", match: (p) => p.startsWith(`${S}/progress`) },
  { label: "Mukofotlar", href: `${S}/rewards`, icon: "rewards", match: (p) => p.startsWith(`${S}/rewards`) },
  {
    label: "Profil",
    href: `${S}/account`,
    icon: "profile",
    match: (p) => p.startsWith(`${S}/account`) || p.startsWith(`${S}/balance`) || p.startsWith("/u/"),
  },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Daftar", href: `${S}/notebook`, icon: "notebook", match: (p) => p.startsWith(`${S}/notebook`) },
  { label: "Grammatika", href: ROUTES.grammar, icon: "grammar", match: (p) => p.startsWith(ROUTES.grammar) },
];

