import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/** Ommaviy: faqat landing (va kelajakda ommaviy sahifalar). Ilova, staff va API qismlari indekslanmaydi. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/student", "/teacher", "/admin", "/u/", "/api/", "/grammar", "/login", "/register", "/forgot-password"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
