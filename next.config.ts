import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Izolyatsiyalangan E2E build uchun (NEXT_DIST_DIR); standart .next — foydalanuvchining dev/build'iga tegmaydi.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  // Brauzer /api/* ga murojaat qiladi, Next uni backendga yo‘naltiradi: cookie bir origin'da qoladi.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://127.0.0.1:4000"}/api/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
