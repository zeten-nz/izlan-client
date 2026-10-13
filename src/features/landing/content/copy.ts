/**
 * Landing matnlari. Dizaynga tegmasdan matnni shu yerda tahrirlash mumkin.
 * Yozuv: o‘zbek lotin, tutuq belgisi ‘ ’ (shriftda mavjud).
 */

export const TICKER = [
  "Daraja testi",
  "Yo‘l xaritasi",
  "Dars",
  "Mashq",
  "Xatolar ustida ishlash",
  "Kunlik reja",
  "Progress",
  "XP",
  "IZL",
] as const;

export const CONTRASTS = [
  {
    other: "100 ta video, qaerdan boshlashni o‘zingiz bilmaysiz.",
    izlan: "Avval qisqa test. Qaerda turganingizni aniq aytadi.",
  },
  {
    other: "Hamma uchun bir xil dars.",
    izlan: "Yo‘l xaritasi sizning natijangizga qarab quriladi.",
  },
  {
    other: "Xato qilsangiz, shunchaki “noto‘g‘ri”.",
    izlan: "Nega xato ekanini tushuntiradi va qayta o‘rgatadi.",
  },
  {
    other: "Qancha o‘rganganingiz noaniq.",
    izlan: "Har bir mavzu bo‘yicha o‘zlashtirish darajasi ko‘rinib turadi.",
  },
] as const;

export const STEPS = [
  {
    id: "test",
    n: "01",
    title: "Bilimni aniqlash",
    text: "Qisqa test sizning hozirgi darajangizni ko‘rsatadi. Taxmin emas, javoblaringizga qarab.",
  },
  {
    id: "roadmap",
    n: "02",
    title: "Shaxsiy yo‘l xaritasi",
    text: "Aynan sizga kerak mavzular, to‘g‘ri tartibda. Bilganingizni takrorlab vaqt sarflamaysiz.",
  },
  {
    id: "lesson",
    n: "03",
    title: "Dars va mashq",
    text: "Avval tushuntirish, keyin amaliyot: tanlash, juftlash, tartiblash, tinglash va o‘qib tushunish.",
  },
  {
    id: "mistakes",
    n: "04",
    title: "Xato ustida ishlash",
    text: "Xato qilsangiz, sababi tushuntiriladi. Shu mavzu keyinroq yana qaytadi, to o‘zlashtirmaguncha.",
  },
  {
    id: "progress",
    n: "05",
    title: "Progress va mukofot",
    text: "Har bir qadam hisobga olinadi. Keyingi reja natijangizga qarab o‘zgarib boradi.",
  },
] as const;

export const FEATURES = [
  {
    id: "placement",
    title: "Aniqlovchi test",
    text: "Daraja taxmin bilan emas, javoblar asosida belgilanadi.",
  },
  {
    id: "roadmap",
    title: "Shaxsiy yo‘l xaritasi",
    text: "Mavzular tartibi sizning bilimingizga moslanadi.",
  },
  {
    id: "formats",
    title: "Turli mashq turlari",
    text: "Tanlash, juftlash, tartiblash, tinglash, o‘qib tushunish.",
  },
  {
    id: "mistakes",
    title: "Xatolar tahlili",
    text: "Nima uchun xato ekanini tushuntiradi va mavzuni qayta o‘rgatadi.",
  },
  {
    id: "daily",
    title: "Kunlik reja",
    text: "Bugun nima qilish kerakligini o‘ylab o‘tirmaysiz.",
  },
  {
    id: "honest",
    title: "Halol baholash",
    text: "Izlan bilmagan narsangizni “bilasiz” demaydi. Hali tekshirilmagan mavzu tekshirilmagan deb ko‘rsatiladi.",
  },
] as const;

export const FIT_QUESTIONS = [
  {
    id: "goal",
    q: "Hozir nima kerak?",
    options: [
      { id: "zero", label: "Noldan boshlayman", w: 2 },
      { id: "order", label: "Bilganimni tartibga solmoqchiman", w: 2 },
      { id: "exam", label: "Imtihon yoki sertifikatga tayyorlanyapman", w: 0 },
    ],
  },
  {
    id: "style",
    q: "Qanday o‘rganasiz?",
    options: [
      { id: "self", label: "Mustaqil, o‘z vaqtimda", w: 2 },
      { id: "mixed", label: "Asosan mustaqil, ba’zan yordam kerak", w: 1 },
      { id: "live", label: "Jonli ustoz yonimda bo‘lishi shart", w: 0 },
    ],
  },
  {
    id: "time",
    q: "Kuniga qancha vaqt ajrata olasiz?",
    options: [
      { id: "short", label: "10–15 daqiqa", w: 2 },
      { id: "long", label: "30–60 daqiqa", w: 2 },
      { id: "none", label: "Vaqtim noaniq", w: 0 },
    ],
  },
  {
    id: "subject",
    q: "Nimani o‘rganmoqchisiz?",
    options: [
      { id: "english", label: "Ingliz tili", w: 2 },
      { id: "other", label: "Boshqa fan", w: 0 },
    ],
  },
] as const;

export type FitQuestionId = (typeof FIT_QUESTIONS)[number]["id"];
export type FitAnswers = Partial<Record<FitQuestionId, string>>;

export const FAQ = [
  {
    q: "Izlan aynan nima?",
    a: "Mustaqil o‘rganish platformasi. U videodarslar ombori emas: avval bilimingizni aniqlaydi, keyin shaxsiy yo‘l xaritasi tuzadi, dars va mashqlar bilan o‘rgatadi, xatolaringizni tushuntiradi va natijangizga qarab keyingi o‘qishni moslab boradi.",
  },
  {
    q: "Qaysi fanlar bor?",
    a: "Hozir Ingliz tili A1 darajasidan boshlab o‘rgatiladi. Boshqa fanlar va yuqori darajalar bosqichma-bosqich qo‘shiladi. Qo‘shilgan sari yo‘l xaritangizda ko‘rinadi.",
  },
  {
    q: "Ustoz kerakmi?",
    a: "Yo‘q. Izlan mustaqil o‘qiydiganlar uchun yaratilgan. Agar sizga jonli ustoz bilan muloqot muhim bo‘lsa, Izlan uni almashtirmaydi, lekin o‘z ishingizni mustahkamlash uchun yaxshi qo‘shimcha bo‘ladi.",
  },
  {
    q: "Imtihon yoki sertifikat kafolatlanadimi?",
    a: "Yo‘q, va bunday va’da bermaymiz. Izlan bilim bazangizni mustahkam qiladi va qaerda zaif ekaningizni ko‘rsatadi. Imtihonga tayyorgarlikda u asosiy emas, yordamchi vosita bo‘lishi mumkin.",
  },
  {
    q: "Kuniga qancha vaqt kerak?",
    a: "Kuniga 10–15 daqiqa ham yetadi, asosiysi muntazamlik. Kunlik reja shu vaqtga moslab mashqlar tanlaydi.",
  },
  {
    q: "Telefondan ishlaydimi?",
    a: "Veb-sayt telefon brauzerida ham qulay ishlaydi. Alohida mobil ilova keyingi bosqichda rejalashtirilgan.",
  },
  {
    q: "To‘lov qanday amalga oshiriladi?",
    a: "Obuna oylik. O‘zbekistonda keng tarqalgan to‘lov tizimlari (Click, Payme) orqali to‘lash rejalashtirilgan. Bepul tarif bilan to‘lovsiz boshlash mumkin.",
  },
  {
    q: "Bolam uchun mosmi?",
    a: "Platforma 11 yoshdan boshlab o‘quvchilar uchun mo‘ljallangan. Voyaga yetmaganlar uchun maxfiylik va ota-ona roziligi qoidalari ishga tushishdan oldin alohida e’lon qilinadi.",
  },
] as const;
