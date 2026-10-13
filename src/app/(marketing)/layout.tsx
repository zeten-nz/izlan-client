import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

/**
 * Marketing guruhi. Login/Register qo‘shilganda ular `(auth)` guruhida,
 * o‘z layout'i bilan (header/footersiz) yaratiladi va bu faylga tegmaydi.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
