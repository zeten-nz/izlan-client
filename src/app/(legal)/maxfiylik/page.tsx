import type { Metadata } from "next";
import { LEGAL_DRAFT, LegalPage, PLACEHOLDER } from "@/features/legal/LegalPage";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "Izlan qanday shaxsiy ma'lumotlarni, qaysi maqsadda va qancha muddat qayta ishlaydi.",
  alternates: { canonical: "/maxfiylik" },
  robots: LEGAL_DRAFT ? { index: false } : undefined,
};

/** Ro'yxat koddagi haqiqiy ma'lumotlarga asoslangan (audit: IZLAN-LEGAL-COMPLIANCE-AUDIT.md, 2.1-bo'lim). */
export default function MaxfiylikPage() {
  return (
    <LegalPage title="Maxfiylik siyosati" updated="2026-yil noyabr (loyiha)">
      <section>
        <h2>1. Operator</h2>
        <p>
          Shaxsga doir ma&apos;lumotlar operatori: {PLACEHOLDER("yuridik shaxs / YaTT nomi, STIR, manzil")}. Murojaatlar uchun: {PLACEHOLDER("email")}.
        </p>
      </section>
      <section>
        <h2>2. Qanday ma&apos;lumotlar yig&apos;iladi</h2>
        <ul>
          <li>Ro&apos;yxatdan o&apos;tish: ism, familiya, username, tug&apos;ilgan yil, email, parol (faqat xeshlangan holda saqlanadi).</li>
          <li>Kirish sessiyalari: brauzer turi (user-agent) va sessiya muddati.</li>
          <li>O&apos;qish faoliyati: darslar, test javoblari, xatolar, daftar yozuvlari (lug&apos;at, eslatmalar, saqlanganlar), XP va yutuqlar.</li>
          <li>Profil: bio, ommaviylik sozlamasi, tanlangan bezaklar. Profil standart holatda yopiq.</li>
          <li>To&apos;lovlar: balans, to&apos;ldirish so&apos;rovlari va bank bildirishnomasi ma&apos;lumotlari (summa, vaqt, xabar matni).</li>
        </ul>
      </section>
      <section>
        <h2>3. Maqsadlar</h2>
        <ul>
          <li>Hisobni yaratish, kirish va xavfsizlik (tasdiqlash kodlari, parolni tiklash).</li>
          <li>Shaxsiy o&apos;quv yo&apos;lini tuzish, progress va takrorlashni ko&apos;rsatish.</li>
          <li>To&apos;lovni foydalanuvchi hisobiga to&apos;g&apos;ri yozish va nizolarni hal qilish.</li>
        </ul>
        <p className="mt-3">Reklama yoki analitika uchun uchinchi tomon kuzatuv vositalari ishlatilmaydi. Sayt faqat kirish uchun zarur cookie ishlatadi.</p>
      </section>
      <section>
        <h2>4. Uchinchi tomonlar va saqlash joyi</h2>
        <ul>
          <li>Email yuborish xizmati: {PLACEHOLDER("provayder nomi va mamlakati")} — faqat email manzili va tasdiqlash kodi uzatiladi.</li>
          <li>Ma&apos;lumotlar bazasi va fayllar joylashgan server: {PLACEHOLDER("data-markaz, O'zbekiston hududida")}.</li>
        </ul>
      </section>
      <section>
        <h2>5. Saqlash muddati</h2>
        <p>{PLACEHOLDER("har bir toifa uchun saqlash muddati — yurist bilan")}. Moliyaviy yozuvlar qonunda belgilangan muddat davomida saqlanadi.</p>
      </section>
      <section>
        <h2>6. Huquqlaringiz</h2>
        <ul>
          <li>O&apos;z ma&apos;lumotlaringiz bilan tanishish va ularni tuzatish (profil sahifasida).</li>
          <li>Rozilikni qaytarib olish va hisobni o&apos;chirishni so&apos;rash: {PLACEHOLDER("email / murojaat tartibi")}.</li>
          <li>18 yoshgacha bo&apos;lgan foydalanuvchi nomidan ota-onasi yoki qonuniy vakili murojaat qilishi mumkin.</li>
        </ul>
      </section>
      <section>
        <h2>7. Xavfsizlik</h2>
        <p>
          Parollar va tasdiqlash kodlari ochiq saqlanmaydi, sessiya tokenlari xeshlanadi, ulanish HTTPS orqali. Ma&apos;lumotlar sizib chiqqan taqdirda
          foydalanuvchilar va vakolatli organ qonunda belgilangan tartibda xabardor qilinadi.
        </p>
      </section>
    </LegalPage>
  );
}
