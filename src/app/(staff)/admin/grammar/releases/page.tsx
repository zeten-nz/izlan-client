import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReleasePanel, type Activation, type ReleaseRow, type Status } from "@/features/grammar-admin/ReleasePanel";
import { GrammarLoading } from "@/features/grammar-admin/RulePage";
import { AdminNav } from "@/features/staff/AdminNav";
import { apiGet } from "@/server/api";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Admin: grammatika release'lari", robots: { index: false } };

async function Releases() {
  await requireRole("ADMIN");
  const [status, releases, activations] = await Promise.all([
    apiGet<Status>("/admin/grammar/release-status"),
    apiGet<ReleaseRow[]>("/admin/grammar/releases"),
    apiGet<Activation[]>("/admin/grammar/activations"),
  ]);
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-8 sm:py-10">
      <AdminNav active="grammar" />
      <Link href="/admin/grammar" className="label underline underline-offset-4">
        ← Qoidalar
      </Link>
      <h1 className="display-cond mt-3 text-[clamp(30px,5vw,52px)]">Release&apos;lar</h1>
      <div className="mt-8">
        <ReleasePanel status={status} releases={releases} activations={activations} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<GrammarLoading />}>
      <Releases />
    </Suspense>
  );
}
