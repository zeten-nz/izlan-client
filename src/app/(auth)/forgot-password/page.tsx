import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Parolni tiklash",
  description: "Email orqali kod olib, parolni qayta o'rnating.",
  robots: { index: false },
};

export default function Page() {
  return <ForgotPasswordForm />;
}
