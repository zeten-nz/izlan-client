import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { SITE } from "@/config/site";

/** Bu guruhda faqat landing ("/") bor, shuning uchun canonical shu yerda (ildiz layout'da emas — u hamma sahifaga meros bo'lardi). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Tuzilgan ma'lumot (schema.org): qidiruv tizimlari uchun tashkilot va sayt. Faqat statik qiymatlar — XSS xavfi yo'q. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/icon-512.png`,
    },
    {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      inLanguage: "uz",
      description: SITE.description,
    },
  ],
};

/**
 * Marketing guruhi. Login/Register qo‘shilganda ular `(auth)` guruhida,
 * o‘z layout'i bilan (header/footersiz) yaratiladi va bu faylga tegmaydi.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      <SiteShell>{children}</SiteShell>
    </>
  );
}
