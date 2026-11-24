"use client";

import "./globals.css";
import { useEffect } from "react";

/**
 * Root layout'ning o'zi yiqilganda. O'z <html>/<body> sini chizadi; shriftlar yuklanmaydi (fallback ishlatiladi).
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="uz">
      <body className="bg-paper text-ink">
        <main role="alert" className="mx-auto max-w-[900px] px-4 py-24">
          <p className="label">Izlan</p>
          <h1 className="mt-4 text-4xl font-black uppercase">Nimadir noto&apos;g&apos;ri ketdi</h1>
          <p className="mt-4 max-w-lg text-xl">Sahifani yuklab bo&apos;lmadi. Bir ozdan keyin qayta urinib ko&apos;ring.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => retry()} className="label border-[3px] border-ink bg-acid px-4 py-3">
              Qayta urinish
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- root layout ishlamayapti, to'liq yuklash kerak */}
            <a href="/" className="label border-[3px] border-ink bg-white px-4 py-3">
              Bosh sahifa
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
