import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Majburiy (hech narsani buzmaydigan) CSP qismlari: iframe'ga joylash, <base> va <object> taqiqlanadi, formalar faqat o'z origin'iga.
 * HSTS bu yerda emas — HTTPS'ni Nginx beradi va HSTS ham o'sha yerda qo'yiladi.
 */
const CSP_ENFORCED = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'", "form-action 'self'"].join("; ");

/**
 * To'liq CSP hozircha faqat Report-Only: brauzer konsolida buzilishlarni ko'rsatadi, hech narsani bloklamaydi.
 * Inline preloader skripti (app/layout.tsx) va Next'ning inline skriptlari uchun 'unsafe-inline' kerak;
 * nonce'ga o'tkazish keyingi qadam. Dev'da HMR uchun 'unsafe-eval' va ws: qo'shiladi.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "worker-src 'self' blob:",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_ENFORCED },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  // Izolyatsiyalangan E2E build uchun (NEXT_DIST_DIR); standart .next — foydalanuvchining dev/build'iga tegmaydi.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Dev'dagi sudraladigan "N" indikatori mobil pastki navigatsiya ustida turadi va Firefox touch-emulyatsiyasida
  // Next DevTools'ning o'z kodida "releasePointerCapture: Invalid pointer id" xatosini chiqaradi (ilova kodi emas).
  // Indikator yashiriladi; Next rasmiy hujjatiga ko'ra compile/runtime xatolari baribir ko'rsatiladi. Faqat dev'ga ta'sir qiladi.
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Brauzer /api/* ga murojaat qiladi, Next uni backendga yo‘naltiradi: cookie bir origin'da qoladi.
  // /api/internal/* (pay-bot, grammatika ichki API'si) ataylab o'tkazilMAYDI: ularni faqat server tarmog'idan
  // to'g'ridan-to'g'ri backendga (API_URL, 127.0.0.1:4000) chaqirishadi; brauzerdan → Next 404.
  async rewrites() {
    return [
      {
        source: "/api/:path((?!internal(?:/|$)).*)",
        destination: `${process.env.API_URL ?? "http://127.0.0.1:4000"}/api/:path`,
      },
    ];
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
