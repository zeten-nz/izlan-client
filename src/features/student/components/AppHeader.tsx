import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { IconLink } from "@/components/ui/IconButton";
import { ROUTES } from "@/config/routes";
import { AppNav } from "./AppNav";
import { NavIcon } from "./NavIcon";
import { SECONDARY_NAV } from "./nav";

/**
 * Sarlavha qatlamlari aniq ajratilgan:
 *  - chap: logo (bosh sahifa);
 *  - o'rta (lg+): asosiy bo'limlar (AppNav) — mobilda ular pastki panelda (BottomNav);
 *  - o'ng: vositalar (Daftar, Grammatika — ikonka + tooltip).
 * Profil, Balans va Chiqish alohida tugmada EMAS: Profil asosiy navigatsiyada bor, Balans kartasi va Chiqish
 * (tasdiq bilan) Profil sahifasining o'zida — bir xil manzilga ikki yo'l bo'lmasin.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-2 px-3 py-2.5 min-[360px]:gap-3 min-[360px]:px-4 sm:px-8 sm:py-3">
        <Link href={ROUTES.student} aria-label="Izlan, asosiy sahifa" className="shrink-0 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cobalt">
          {/* O'ngda faqat 2 ta ikonka qolgani uchun to'liq logo 320px'da ham sig'adi */}
          <Logo />
        </Link>
        <nav aria-label="Asosiy bo'limlar" className="hidden lg:block">
          <AppNav />
        </nav>
        <nav aria-label="Vositalar" className="flex shrink-0 items-center gap-2">
          {SECONDARY_NAV.map((item) => (
            <IconLink key={item.href} href={item.href} label={item.label}>
              <NavIcon id={item.icon} className="size-5" />
            </IconLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
