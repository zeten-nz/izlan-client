/** Barcha ichki yo‘llar shu yerda. */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
} as const;

export type Role = "STUDENT" | "TEACHER" | "ADMIN";

/** Kirgandan keyin rolga qarab bosh sahifa. */
export const roleHome = (role: Role) => (role === "ADMIN" ? ROUTES.admin : role === "TEACHER" ? ROUTES.teacher : ROUTES.student);

/** Hali yaratilmagan, lekin havolasi mavjud yo‘llar (404 sahifa "tez orada" xabari uchun ishlatadi). */
export const UPCOMING_ROUTES: readonly string[] = [];

/** Landing sahifa ichidagi bo‘limlar (anchor). */
export const SECTIONS = {
  how: "qanday-ishlaydi",
  features: "imkoniyatlar",
  fit: "menga-mosmi",
  pricing: "tariflar",
  faq: "savollar",
} as const;

export const sectionHref = (id: (typeof SECTIONS)[keyof typeof SECTIONS]) => `/#${id}`;
