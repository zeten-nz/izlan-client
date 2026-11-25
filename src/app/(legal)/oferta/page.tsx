import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_DRAFT, LegalPage, PLACEHOLDER } from "@/features/legal/LegalPage";

export const metadata: Metadata = {
  title: "Ommaviy oferta",
  description: "Izlan platformasidan foydalanish va pullik kirish (obuna) shartlari.",
  alternates: { canonical: "/oferta" },
  robots: LEGAL_DRAFT ? { index: false } : undefined,
};

export default function OfertaPage() {
  return (
    <LegalPage title="Ommaviy oferta va foydalanish shartlari" updated="2026-yil noyabr (loyiha)">
      <section>
        <h2>1. Taraflar</h2>
        <p>
          Ushbu hujjat {PLACEHOLDER("yuridik shaxs / YaTT nomi")} (STIR {PLACEHOLDER("STIR")}, manzil {PLACEHOLDER("yuridik manzil")}, aloqa{" "}
          {PLACEHOLDER("telefon, email")}) — keyingi o&apos;rinlarda «Izlan» — tomonidan izlan.uz platformasi foydalanuvchilariga qilingan ommaviy
          taklif (oferta) hisoblanadi. Ro&apos;yxatdan o&apos;tishda rozilik belgisini qo&apos;yish va/yoki xizmat uchun to&apos;lov qilish ushbu
          shartlarni to&apos;liq qabul qilish (aksept) deb hisoblanadi.
        </p>
      </section>
      <section>
        <h2>2. Xizmat</h2>
        <ul>
          <li>Izlan — mustaqil o&apos;rganish platformasi: darslar, mashqlar, daraja testi, grammatika ma&apos;lumotnomasi va shaxsiy daftar.</li>
          <li>Platforma diplom, sertifikat yoki davlat namunasidagi hujjat bermaydi.</li>
          <li>Bepul qism: har bir darajaning birinchi mavzusi va bepul deb belgilangan kurslar.</li>
          <li>Pullik qism: kurs (yo&apos;nalish) bo&apos;yicha 30 kunlik kirish. Narx saytda so&apos;mda ko&apos;rsatiladi.</li>
        </ul>
      </section>
      <section>
        <h2>3. Balans va to&apos;lov</h2>
        <ul>
          <li>Balans — kurslarga kirish uchun oldindan to&apos;langan mablag&apos; (so&apos;mda). U XP va IZL ballaridan alohida: ballar pulga almashtirilmaydi va pul bilan sotib olinmaydi.</li>
          <li>
            Balansni to&apos;ldirishda sayt aniq summani ko&apos;rsatadi (masalan, 50 045 so&apos;m). Oxirgi 1–99 so&apos;m to&apos;lovni tanish uchun; balansga
            asosiy summa (masalan, 50 000 so&apos;m) yoziladi. {PLACEHOLDER("ortiqcha qism bo'yicha yakuniy qoida — qaror kutilmoqda")}
          </li>
          <li>Kurs sotib olinganda narx balansdan yechiladi va kirish 30 kunga ochiladi (faol kirish bo&apos;lsa, muddat uzaytiriladi).</li>
          <li>To&apos;lov usuli, to&apos;lov tashkiloti va fiskal chek: {PLACEHOLDER("to'lov provayderi va fiskal chek tartibi")}.</li>
        </ul>
      </section>
      <section>
        <h2>4. Qaytarish</h2>
        <p>
          Foydalanilmagan balansni qaytarish tartibi, muddati va usuli: {PLACEHOLDER("qaytarish siyosati — yurist bilan")}. Murojaat:{" "}
          {PLACEHOLDER("email")}.
        </p>
      </section>
      <section>
        <h2>5. Foydalanuvchi majburiyatlari</h2>
        <ul>
          <li>Hisob ma&apos;lumotlarini to&apos;g&apos;ri ko&apos;rsatish va parolni boshqalarga bermaslik.</li>
          <li>Platforma kontentini ruxsatsiz nusxalamaslik va tarqatmaslik.</li>
          <li>Boshqa foydalanuvchilarga zarar yetkazadigan, qonunga zid kontent joylashtirmaslik (profil, eslatmalar va h.k.).</li>
        </ul>
      </section>
      <section>
        <h2>6. Voyaga yetmaganlar</h2>
        <p>
          Platformadan 11 yoshdan foydalanish mumkin. 18 yoshgacha bo&apos;lgan foydalanuvchilar ro&apos;yxatdan o&apos;tishi va ayniqsa to&apos;lov qilishi
          ota-onasi yoki qonuniy vakilining roziligi bilan amalga oshiriladi. {PLACEHOLDER("yosh chegarasi va rozilik tartibi — qaror kutilmoqda")}
        </p>
      </section>
      <section>
        <h2>7. Shaxsiy ma&apos;lumotlar</h2>
        <p>
          Ma&apos;lumotlar <Link href="/maxfiylik" className="font-semibold underline">maxfiylik siyosati</Link>ga muvofiq qayta ishlanadi.
        </p>
      </section>
      <section>
        <h2>8. Nizolar va o&apos;zgartirishlar</h2>
        <p>
          Nizolar O&apos;zbekiston Respublikasi qonunchiligiga muvofiq hal qilinadi. Izlan shartlarni o&apos;zgartirishi mumkin; yangi tahrir saytda
          e&apos;lon qilingan kundan kuchga kiradi, muhim o&apos;zgarishlar haqida foydalanuvchilar oldindan xabardor qilinadi.
        </p>
      </section>
    </LegalPage>
  );
}
