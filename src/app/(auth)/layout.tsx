import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Marquee } from "@/components/ui/Marquee";
import { Sticker } from "@/components/ui/Sticker";
import { ROUTES } from "@/config/routes";

/** Login / Register / Parolni tiklash uchun umumiy qobiq: landing bilan bir xil rang, shrift va qalin chiziqlar. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden border-r-[3px] border-ink bg-cobalt text-paper lg:flex lg:flex-col lg:justify-between" aria-hidden>
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 [filter:invert(1)]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-[460px] rounded-full bg-acid" />
        <div className="pointer-events-none absolute right-16 top-28 size-24 animate-wobble border-[3px] border-ink bg-tomato shadow-[6px_6px_0_0_var(--color-ink)]" />

        <div className="relative p-10">
          <Link href={ROUTES.home} tabIndex={-1}>
            <Logo tone="light" />
          </Link>
        </div>

        <div className="relative px-10">
          <Sticker tone="acid" rotate={-4}>
            O&apos;zingiz o&apos;rganing
          </Sticker>
          <p className="display mt-6 text-[clamp(64px,8vw,132px)]">
            Izla.
            <br />
            <span className="text-acid">Bil.</span>
            <br />
            <span className="[-webkit-text-stroke:3px_var(--color-paper)] text-transparent">Yut.</span>
          </p>
        </div>

        <Marquee
          items={["Daraja testi", "Shaxsiy yo'l xaritasi", "Xato tahlili", "IZL ball"]}
          className="label relative border-t-[3px] border-ink bg-ink py-3.5 text-paper"
        />
      </aside>

      <main className="relative flex flex-col bg-paper">
        <header className="flex items-center justify-between border-b-[3px] border-ink px-4 py-4 sm:px-8 lg:border-b-0 lg:justify-end">
          <Link href={ROUTES.home} aria-label="Izlan, bosh sahifa" className="lg:hidden">
            <Logo />
          </Link>
          <Link href={ROUTES.home} className="label border-[3px] border-ink bg-white px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-acid">
            ← Bosh sahifa
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
