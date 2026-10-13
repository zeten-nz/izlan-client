"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HomeLink } from "@/components/brand/HomeLink";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink, Arrow } from "@/components/ui/Button";
import { ROUTES, SECTIONS, sectionHref } from "@/config/routes";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Qanday ishlaydi", href: sectionHref(SECTIONS.how) },
  { label: "Imkoniyatlar", href: sectionHref(SECTIONS.features) },
  { label: "Menga mosmi?", href: sectionHref(SECTIONS.fit) },
  { label: "Tariflar", href: sectionHref(SECTIONS.pricing) },
  { label: "Savollar", href: sectionHref(SECTIONS.faq) },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b-[3px] border-ink bg-paper transition-shadow",
        scrolled && "shadow-[0_6px_0_0_var(--color-ink)]",
      )}
      style={{ height: "var(--header-h)" }}
    >
      <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 md:px-8">
        <HomeLink aria-label="Izlan, bosh sahifa" onNavigate={() => setOpen(false)}>
          <Logo />
        </HomeLink>

        <nav aria-label="Asosiy" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label px-3 py-2 transition-colors hover:bg-ink hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href={ROUTES.login}
            className="label hidden px-3 py-2 underline decoration-[3px] underline-offset-4 hover:bg-ink hover:text-paper sm:inline-block"
          >
            Kirish
          </Link>
          <ButtonLink href={ROUTES.register} variant="acid" className="!px-3 !py-2 text-[12px] md:!px-5 md:!py-2.5 md:text-[13px]">
            Boshlash <Arrow />
          </ButtonLink>
          <button
            type="button"
            className="grid size-11 place-items-center border-[3px] border-ink bg-paper lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-[3px] bg-ink transition-transform",
                  open && "translate-y-[5.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-[3px] bg-ink transition-transform",
                  open && "-translate-y-[5.5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto bg-ink p-5 text-paper lg:hidden"
          >
            <nav aria-label="Mobil menyu" className="flex flex-col">
              {NAV.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="display flex items-baseline justify-between border-b-[3px] border-paper/25 py-5 text-[clamp(32px,9vw,52px)] hover:text-acid"
                >
                  {item.label}
                  <span className="label text-paper/50">0{i + 1}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-4">
              <ButtonLink href={ROUTES.register} size="lg" variant="acid" onClick={() => setOpen(false)}>
                Ro‘yxatdan o‘tish <Arrow />
              </ButtonLink>
              <ButtonLink href={ROUTES.login} size="lg" variant="paper" onClick={() => setOpen(false)}>
                Kirish
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
