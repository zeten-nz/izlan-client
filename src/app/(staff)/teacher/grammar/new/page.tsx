import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { LanguageCfg } from "@/features/grammar-admin/gapi";
import { NewRuleForm } from "@/features/grammar-admin/NewRuleForm";
import { GrammarLoading } from "@/features/grammar-admin/RulePage";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Yangi qoida", robots: { index: false } };

async function New() {
  await requireRole("TEACHER");
  const languages = await apiGet<LanguageCfg[]>("/staff/grammar/languages");
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/teacher/grammar" className="label underline underline-offset-4">
        ← Qoidalar
      </Link>
      <h1 className="display-cond mt-3 text-[clamp(30px,5vw,52px)]">Yangi qoida</h1>
      <div className="mt-8">
        <NewRuleForm languages={languages} base="/teacher/grammar" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<GrammarLoading />}>
      <New />
    </Suspense>
  );
}
