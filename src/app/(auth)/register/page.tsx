import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish",
  description: "Izlan hisobini yarating va o'rganishni boshlang.",
  robots: { index: false },
};

export default function Page() {
  return <RegisterForm />;
}
