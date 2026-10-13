import { FIT_QUESTIONS, type FitAnswers } from "../content/copy";

export type FitTier = "yes" | "maybe" | "no";
export type FitNote = { kind: "good" | "warn" | "bad"; text: string };
export type FitResult = { tier: FitTier; summary: string; notes: FitNote[] };

/** Har bir javob uchun halol izoh. Kalit: `${savol}.${variant}` */
const NOTES: Record<string, string> = {
  "goal.zero": "Noldan boshlash Izlan uchun eng qulay holat: test sizni to‘g‘ri nuqtadan boshlaydi.",
  "goal.order": "Bilganingizni tartibga solish uchun test zaif joylaringizni topib beradi.",
  "goal.exam": "Izlan imtihon yoki sertifikat natijasini kafolatlamaydi. U asos yaratadi, lekin maxsus tayyorlov kursini almashtirmaydi.",
  "style.self": "Mustaqil o‘rganish aynan Izlan mo‘ljallagan uslub.",
  "style.mixed": "Qiyin joylarda tushuntirishlar yordam beradi, qolganini o‘zingiz yurgizasiz.",
  "style.live": "Izlan jonli ustozning o‘rnini bosmaydi. Uni qo‘shimcha mashq sifatida ishlating.",
  "time.short": "Kuniga 10–15 daqiqalik reja sizga yetarli.",
  "time.long": "Bunday vaqt bilan yo‘l xaritasi tez ilgarilaydi.",
  "time.none": "Muntazamlik bo‘lmasa natija sekin keladi. Kichik, lekin har kuni o‘qing.",
  "subject.english": "Ingliz tili A1 darajasidan boshlab hozir tayyor.",
  "subject.other": "Boshqa fanlar hozircha tayyor emas. Ular bosqichma-bosqich qo‘shiladi.",
};

const MAX_SCORE = FIT_QUESTIONS.length * 2;

/**
 * Javoblar bo‘yicha xulosa. Qoida:
 *  - fan Ingliz tili emas → hech qachon "yes" bo‘lmaydi (hozir mavjud emas).
 *  - ball ≥ 7 → yes; ≥ 4 → maybe; undan past → no.
 */
export function evaluateFit(answers: FitAnswers): FitResult {
  let score = 0;
  const notes: FitNote[] = [];

  for (const q of FIT_QUESTIONS) {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    if (!opt) continue;
    score += opt.w;
    const text = NOTES[`${q.id}.${opt.id}`];
    if (text) notes.push({ kind: opt.w === 2 ? "good" : opt.w === 1 ? "warn" : "bad", text });
  }

  const noSubject = answers.subject !== "english";
  let tier: FitTier = score >= MAX_SCORE - 1 ? "yes" : score >= 4 ? "maybe" : "no";
  if (noSubject && tier === "yes") tier = "maybe";

  // Yomon izohlar oxirida emas, boshida ko‘rinsin (muhimi ochiq aytilsin).
  const order = { bad: 0, warn: 1, good: 2 } as const;
  notes.sort((a, b) => order[a.kind] - order[b.kind]);

  const summary = {
    yes: "Sizning maqsadingiz, o‘rganish uslubingiz va vaqtingiz Izlanga mos keladi. Testdan boshlash eng to‘g‘ri qadam.",
    maybe: "Izlan sizga foyda beradi, lekin ba’zi narsalarni oldindan bilgan ma’qul. Quyida qisqacha.",
    no: "Hozirgi ehtiyojingiz Izlanning kuchli tomoniga to‘g‘ri kelmaydi. Aldamaymiz: boshqa yo‘l siz uchun yaxshiroq bo‘lishi mumkin. Xohlasangiz, bepul tarif bilan o‘zingiz baho bera olasiz.",
  }[tier];

  return { tier, summary, notes };
}
