import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/** Faqat mavjud sahifalar. Auth sahifalari indekslanmaydi. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, changeFrequency: "weekly", priority: 1 }];
}
