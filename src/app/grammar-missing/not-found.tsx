import type { Metadata } from "next";
import { GrammarNotFound } from "@/features/grammar/components/GrammarNotFound";

export const metadata: Metadata = { title: "Qoida topilmadi", robots: { index: false, follow: false } };

/** Marketing qobig'isiz: login qilgan foydalanuvchi landing header'ini ko'rmaydi. */
export default function NotFound() {
  return <GrammarNotFound standalone />;
}
