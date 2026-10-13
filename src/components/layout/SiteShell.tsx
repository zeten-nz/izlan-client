import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Marketing sahifalar (landing, 404, kelajakda narxlar/maqolalar) uchun umumiy qobiq. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="label sr-only z-[70] bg-acid px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:border-[3px] focus:border-ink"
      >
        Asosiy mazmunga o‘tish
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
