import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/forms/LoginForm";

export const metadata: Metadata = {
  title: "Kirish",
  description: "Izlan hisobingizga kiring.",
  robots: { index: false },
};

export default function Page() {
  return <LoginForm />;
}
