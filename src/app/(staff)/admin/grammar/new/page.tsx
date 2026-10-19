import type { Metadata } from "next";
import { Suspense } from "react";
import type { LanguageCfg } from "@/features/grammar-admin/gapi";
import { NewRuleForm } from "@/features/grammar-admin/NewRuleForm";
import { GrammarLoading } from "@/features/grammar-admin/RulePage";
import { AdminNav } from "@/features/staff/AdminNav";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: yangi qoida", robots: { index: false } };

async function New() {
  await requireRole("ADMIN");
  const languages = await apiGet<LanguageCfg[]>("/staff/grammar/languages");
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-10">
      <AdminNav active="grammar" />
      <h1 className="display-cond text-[clamp(30px,5vw,52px)]">Yangi qoida</h1>
      <div className="mt-8">
        <NewRuleForm languages={languages} base="/admin/grammar" />
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
