import type { Metadata } from "next";
import { NotFoundView } from "@/components/layout/NotFoundView";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = { title: "Sahifa topilmadi" };

export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundView />
    </SiteShell>
  );
}
