import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/** PWA manifest. Ikonkalar public/brand/ da (manba: D:\izlan-ads\brand\instagram\izlan-instagram-avatar.svg). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: "uz",
    start_url: "/student",
    scope: "/",
    display: "standalone",
    background_color: "#f1eee4",
    theme_color: "#f1eee4",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
